import './style.css';
import {episodes} from './story.js';
import * as pc from 'playcanvas';
import {Scene,Character,Animation,Environment,SkyDome} from '@viggle/splat-engine';

const route=[
 ['输入输出 / IPO','溪畔灯牌','输入名字，输出祝福；说清输入、处理、输出。','从空白完成输入输出。',0],
 ['类型 / 表达式 / 单位','航程小账','换算时间，核对数字与字符串；BMI 作为任务册支线。','单位表、0 与小数用例；字符串清洗。',0],
 ['AI 建议与反例','桃林问路','检验引导伙伴的建议，找到让它失败的输入。','三次失败、反例与修正记录。',1],
 ['调试 / 异常','渡船修补','分别修复语法、运行时与逻辑错误。','能解释原因，独立重试。',0],
 ['分支 / 循环','桃林试灯','猜灯号并跟踪循环；先固定目标，再加入随机。','首次、末次猜中与全部猜错；切片复习。',1],
 ['列表 / 元组','村塾初识','新增成绩，计算平均，按条件筛选。','解释索引、别名与空列表行为。',4],
 ['字典 / 集合','村塾名册','按学号更新、删除、去重与计数。','重复键规则与多键排序。',4],
 ['标准库 / 正则','桃源驿站','提取邮箱、生成号码；任务册月供函数。','命中、不命中与边界样例。',3],
 ['函数 / 参数','工坊分工','拆出薪资与统计函数，对照普通循环和 map/filter。','输入输出约定、参数绑定与返回值。',3],
 ['模块 / 程序入口','众匠协作','把村塾工具拆为模块。','导入时不意外执行主程序。',4],
 ['文件 / CSV / JSON','档案馆','保存问卷，读取并脱敏日志，保留换行。','读—洗—写与读取、写入失败处理。',3],
 ['Pandas / 汇总','丰收账房','清洗样例 CSV，筛选、汇总并画图。','缺失值规则有依据；图表吻合数据。',3],
 ['综合项目','桃源共建','完成输入—处理—保存的成绩管理工具。','验证、用例、说明与独立模拟 A。',4],
 ['独立迁移 / 复测','辞别桃源','关闭提示，换情境完成新题。','模拟 B、隔日解释与核心函数重写。',5],
];
const cameras=[
 ['C01','溪畔启航',[0,2.6,6],[0,1,-1]],['C02','桃林小路',[3,2.3,3],[0,1,-2]],
 ['C03','山口光线',[0,3,-1],[0,2,-12]],['C04','桃源远望',[0,4,4],[0,2,-14]],
 ['C05','渔郎与村塾',[-2.2,1.7,3],[0,.95,0]],['C06','归途回望',[-3,2.8,-3],[0,1,2]],
];
let scene,character,env,windTime=0,paused=false,selectedCamera=0,selectedWeek=0,foliage,frameSum=0,frameN=0;
let storyMode=true,episodeIndex=Math.max(0,Math.min(13,Number(new URLSearchParams(location.search).get('episode'))||0)),beat=0,beatTime=0,storyPlaying=true,walkTime=0;
let hudSide="left",hudCheckTime=0;
const $=s=>document.querySelector(s);
window.preview={ready:false,errors:[],cameras,route};
window.addEventListener('error',e=>{window.preview.errors.push(e.message);$('#loading').textContent='场景错误：'+e.message});
function camera(i){selectedCamera=i;const c=cameras[i];if(scene&&!storyMode){scene.cameraEntity.setPosition(...c[2]);scene.cameraEntity.lookAt(new pc.Vec3(...c[3]));}$('#cameraName').textContent=c[0]+' · '+c[1];document.querySelectorAll('#cameras button').forEach((b,j)=>b.classList.toggle('active',j===i));}
function week(i){selectedWeek=i;const r=route[i];document.querySelectorAll('#route button').forEach((b,j)=>b.classList.toggle('active',j===i));$('#task').innerHTML=`<small>W${String(i+1).padStart(2,'0')} · ${r[1]}</small><h3>${r[0]}</h3><p>${r[2]}</p><p><b>学习证据</b><br>${r[3]}</p>`;camera(r[4]);$('#notes').value=localStorage.getItem('peach-review-'+i)||'';}
route.forEach((r,i)=>{const li=document.createElement('li');const b=document.createElement('button');b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${r[0]}`;b.onclick=()=>week(i);li.append(b);$('#route').append(li)});
cameras.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c[0];b.title=c[1];b.onclick=()=>camera(i);$('#cameras').append(b)});
$('#saveNotes').onclick=()=>{localStorage.setItem('peach-review-'+selectedWeek,$('#notes').value);$('#saved').textContent='已保存到本机 · W'+(selectedWeek+1)};
$('#pause').onclick=()=>{paused=!paused;if(character){character.playbackSpeed=paused?0:1;if(paused){character.animationTime=.8;windTime=0;foliage?.setParameter('uTime',0)}};$('#pause').textContent=paused?'继续风与动作':'暂停风与动作'};
$('#capture').onclick=()=>{if(!scene)return;const a=document.createElement('a');a.download=`R01-${cameras[selectedCamera][0]}-W${selectedWeek+1}.png`;a.href=$('#canvas').toDataURL('image/png');a.click()};
$('#motion').onchange=()=>{if(character)character.crossfadeTo($('#motion').value,{duration:.25,loop:true,rootMotion:false})};
function flatMaterial(color){const m=new pc.StandardMaterial();m.diffuse=new pc.Color(0,0,0);m.useLighting=false;m.emissive=new pc.Color(...color);m.update();return m}
function shape(name,type,pos,scale,color){const e=new pc.Entity(name);e.addComponent('render',{type,material:flatMaterial(color)});e.setPosition(...pos);e.setLocalScale(...scale);scene.app.root.addChild(e);return e}
function ground(){shape('近景草地','box',[0,-.12,-3],[26,.2,28],[.46,.58,.34]);
 // One gently curving creek, tiled to keep its curve editable independently of the splat backdrop.
 for(let z=-15;z<11;z+=.65){const x=4+Math.sin(z*.23)*1.5;shape('溪水','box',[x,-.005,z],[2.1,.025,.72],[.37,.71,.70]);shape('溪岸小路','box',[x-3,.015,z],[1.3,.035,.72],[.81,.74,.56])}
 for(const [x,z]of [[-4,-5],[-7,0],[7,-8],[-6,-11]]){shape('桃树树干','cylinder',[x,.9,z],[.19,1.8,.19],[.38,.29,.20]);for(let k=0;k<9;k++){const a=k*2.399,rr=.35+(k%3)*.35,bx=x+Math.cos(a)*rr,bz=z+Math.sin(a)*rr,by=1.8+(k%4)*.18;const branch=shape('桃树分枝','cylinder',[(x+bx)/2,by-.45,(z+bz)/2],[.06,.95,.06],[.42,.32,.23]);branch.setLocalEulerAngles(Math.sin(a)*40,0,Math.cos(a)*35);for(let j=0;j<3;j++)shape('桃花簇','sphere',[bx+Math.cos(j*2.1)*.18,by+Math.sin(j*1.4)*.12,bz+Math.sin(j*2.1)*.18],[.5,.36,.46],[.91+(j%2)*.04,.60+j*.04,.65+j*.035])}}
}
function plants(){
 let seed=7351;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const positions=[],colors=[],indices=[];const palette=[[.43,.59,.27],[.96,.92,.75],[.64,.53,.74],[.28,.49,.33]];
 for(let i=0;i<30000;){const x=(random()-.5)*25,z=random()*25-15;const creek=4+Math.sin(z*.23)*1.5;if(Math.abs(x-creek)<1.2||Math.abs(x-(creek-3))<.8||Math.hypot(x,z)<.65)continue;
  const kind=i%10===0?1:i%13===0?2:i%7===0?3:0;const h=.16+random()*(kind===3?.45:.34),w=kind===0?.035:.07,a=random()*Math.PI,dx=Math.cos(a)*w,dz=Math.sin(a)*w;const b=positions.length/3;
  positions.push(x-dx,0,z-dz,x+dx,0,z+dz,x+h*.12,h,z);const c=palette[kind];for(let k=0;k<3;k++)colors.push(...c,1);indices.push(b,b+1,b+2);
  const tri=(points,color)=>{const n=positions.length/3;positions.push(...points);for(let q=0;q<3;q++)colors.push(...color,1);indices.push(n,n+1,n+2)};
  if(kind===1){for(let j=0;j<7;j++){const a=j*Math.PI*2/7,aa=a+.38;tri([x,h,z,x+Math.cos(a)*.075,h+.018,z+Math.sin(a)*.075,x+Math.cos(aa)*.075,h+.018,z+Math.sin(aa)*.075],[1,.97,.87])}tri([x-.022,h+.02,z-.02,x+.022,h+.02,z-.02,x,h+.02,z+.024],[.94,.71,.23])}
  if(kind===2){for(let j=0;j<4;j++){const y=h-j*.045;tri([x-.025,y,z,x+.025,y,z,x,y+.07,z],[.57+j*.025,.45+j*.025,.69+j*.025])}}
  if(kind===3){for(let j=1;j<5;j++){const y=h*j/5,w=.15*(1-j/6);for(const dir of [-1,1])tri([x,y-.03,z,x+dir*w,y+.035,z+.035,x,y+.02,z],[.30,.48+j*.015,.28])}}
  i++;
 }
 const mesh=new pc.Mesh(scene.graphicsDevice);mesh.setPositions(positions);mesh.setColors(colors);mesh.setIndices(indices);mesh.update(pc.PRIMITIVE_TRIANGLES);
 const mat=new pc.ShaderMaterial({uniqueName:'PeachWind',attributes:{aPosition:pc.SEMANTIC_POSITION,aColor:pc.SEMANTIC_COLOR},vertexGLSL:`attribute vec3 aPosition;attribute vec4 aColor;uniform mat4 matrix_model;uniform mat4 matrix_viewProjection;uniform float uTime;varying vec4 vColor;void main(){vec3 p=aPosition;p.x+=sin(uTime*1.6+p.x*.7+p.z*.45)*p.y*.25;p.z+=cos(uTime+p.x*.3)*p.y*.13;vColor=aColor;gl_Position=matrix_viewProjection*matrix_model*vec4(p,1.);}`,fragmentGLSL:`precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}`});mat.cull=pc.CULLFACE_NONE;mat.setParameter('uTime',0);foliage=mat;
 const e=new pc.Entity('30000 簇风动植被预览');e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,mat)]});scene.app.root.addChild(e);
}
async function boot(){
 scene=await Scene.create($('#canvas'),{backend:'webgl',depth:true,preserveDrawingBuffer:true,near:.04,far:500,fov:53,bgColor:{r:.82,g:.9,b:.9,a:1},maxPixelRatio:1});
 scene.start();SkyDome.create(scene,{topColor:'#bfe2ed',bottomColor:'#fff4d2'});camera(0);
 $('#loading').textContent='正在测量山谷与载入渔郎…';
 env=await Environment.load(scene,import.meta.env.BASE_URL+'assets/valley-r01.spz');const probe=env.probeGroundDepth(-1);window.preview.groundProbe=probe;
 if(!probe?.depth||probe.depth<=0)throw new Error('未测得有效地面，无法确定山谷尺度');
 const scale=1.5/probe.depth;env.entity.setLocalScale(scale,scale,scale);env.entity.setPosition(0,1.5,-12);window.preview.metresPerUnit=scale;
 ground();plants();
 character=await Character.load(scene,import.meta.env.BASE_URL+'assets/fisherman.vsplat');character.setPosition(0,character.groundToEntityY(0),0);character.setRotation(0,180,0);
 for(const name of ['wave','walk','run','nod','eat','bow','hop']){await Animation.loadGlb(scene,import.meta.env.BASE_URL+'assets/'+name+'.glb',name)}
 character.playAnimation('walk',{loop:true,rootMotion:false});
 scene.app.on('update',dt=>{if(storyMode){updateStory(dt);hudCheckTime+=dt;if(hudCheckTime>.15){placeStoryHud();hudCheckTime=0}}if(!paused)windTime+=dt;foliage?.setParameter('uTime',windTime);frameSum+=dt;frameN++;if(frameSum>1){$('#metrics').textContent=`${Math.round(frameN/frameSum)} fps · 30,000 簇 · ${scale.toFixed(2)} m/u`;window.preview.fps=frameN/frameSum;frameN=0;frameSum=0}});
 window.preview={...window.preview,ready:true,scene,character,env,camera,week,pause:()=>{paused=true;windTime=0;character.playbackSpeed=0;character.animationTime=0;foliage?.setParameter('uTime',0)}};$('#loading').textContent='';
}
setupStory();week(episodeIndex);boot().catch(e=>{$('#loading').textContent='载入失败：'+e.message;window.preview.errors.push(e.stack);console.error(e)});

function setupStory(){
 const controls=document.createElement('div');controls.className='mode-switch';controls.innerHTML='<button id="journeyMode">连续剧情</button><button id="reviewMode">机位检查</button>';$('#world').append(controls);
 const hud=document.createElement('section');hud.id='storyHud';hud.innerHTML='<div class="episode-line"><span id="episodeNo"></span><span id="episodePlace"></span></div><div id="storyProgress"><i></i></div><h2 id="storyTitle"></h2><p id="storyText"></p><pre id="storyCode"></pre><div class="storyActions"><button id="storyBack">上一段</button><button id="storyPause">暂停演出</button><button id="storyNext">继续旅程 →</button></div><small id="storyHint">剧情演出不计为课程通过；独立练习需另行完成。</small>';$('#world').append(hud);
 $('#journeyMode').onclick=()=>setMode(true);$('#reviewMode').onclick=()=>setMode(false);
 $('#storyNext').onclick=()=>{if(beat<2)beat++;else if(episodeIndex<13){episodeIndex++;beat=0;}else{storyPlaying=false;$('#storyHint').textContent='旅程演出结束。打开机位检查，回看每段的独立学习证据。';return}beatTime=0;showBeat()};
 $('#storyBack').onclick=()=>{if(beat>0)beat--;else if(episodeIndex>0){episodeIndex--;beat=2}beatTime=0;showBeat()};
 $('#storyPause').onclick=()=>{storyPlaying=!storyPlaying;$('#storyPause').textContent=storyPlaying?'暂停演出':'继续演出';if(character)character.playbackSpeed=storyPlaying?1:0};
 document.querySelectorAll('#route button').forEach((b,i)=>b.addEventListener('click',()=>{if(storyMode){episodeIndex=i;beat=0;beatTime=0;showBeat()}}));
 setMode(true);showBeat();
}
function setMode(on){storyMode=on;document.body.classList.toggle('journey',on);$('#journeyMode').classList.toggle('active',on);$('#reviewMode').classList.toggle('active',!on);if(on){paused=false;if(character)character.playbackSpeed=storyPlaying?1:0;showBeat()}else{paused=false;if(character)character.playbackSpeed=1;camera(selectedCamera)}}
function showBeat(){
 const e=episodes[episodeIndex],b=e.beats[beat];week(episodeIndex);$('#episodeNo').textContent='第 '+String(episodeIndex+1).padStart(2,'0')+' 集 / 14';$('#episodePlace').textContent=e.place;$('#storyTitle').textContent=e.title;$('#storyText').textContent=b.text;$('#storyCode').textContent=b.code||'';$('#storyCode').hidden=!b.code;$('#storyNext').textContent=beat===2?(episodeIndex===13?'暂别桃源':'下一集 · '+episodes[episodeIndex+1].title+' →'):'继续这一段 →';$('#storyHint').textContent=beat===2?'练习先自己写与解释；20秒后续播下一集。可暂停演出，剧情进度不计为学习通过。':'演出将自动衔接；也可点击继续。';
 if(character){character.crossfadeTo(beat===0?'walk':beat===1?'wave':'nod',{duration:.45,loop:true,rootMotion:false});character.setRotation(0,beat===0?160:0,0)}
}
function updateStory(dt){
 if(!character||!storyPlaying||paused)return;beatTime+=dt;walkTime+=dt;
 const c=cameras[route[episodeIndex][4]],pos=scene.cameraEntity.getPosition();const a=Math.min(1,dt*1.4);scene.cameraEntity.setPosition(pos.x+(c[2][0]-pos.x)*a,pos.y+(c[2][1]-pos.y)*a,pos.z+(c[2][2]-pos.z)*a);scene.cameraEntity.lookAt(new pc.Vec3(...c[3]));
 if(beat===0){const z=1-Math.min(beatTime,8)*.18;character.setPosition(Math.sin(walkTime*.45)*.12,character.groundToEntityY(0),z)}
 $('#storyProgress i').style.width=Math.min(100,beatTime/14*100)+'%';
 if(beatTime>(beat===2?20:14)){if(beat<2){beat++;beatTime=0;showBeat()}else if(episodeIndex<13){episodeIndex++;beat=0;beatTime=0;showBeat()}else{storyPlaying=false;$('#storyHint').textContent='本季演出结束。学习是否达标，以独立作答和隔日复测为准。'}}
}

function placeStoryHud(){
 if(!scene||!character||!storyMode)return;
 const world=$('#world'),hud=$('#storyHud'),bounds=world.getBoundingClientRect(),canvas=$('#canvas');
 const p=character.getPosition(),projected=[];
 for(const dx of [-.7,.7])for(const dy of [0,2.35])for(const dz of [-.45,.45]){
  const v=scene.cameraEntity.camera.worldToScreen(new pc.Vec3(p.x+dx,p.y+dy,p.z+dz));
  if(v.z>0)projected.push(v);
 }
 if(!projected.length)return;
 const sx=bounds.width/canvas.width,sy=bounds.height/canvas.height;
 const actor={left:Math.min(...projected.map(v=>v.x))*sx-20,right:Math.max(...projected.map(v=>v.x))*sx+20,top:Math.min(...projected.map(v=>v.y))*sy-20,bottom:Math.max(...projected.map(v=>v.y))*sy+20};
 const top=bounds.width<900?108:82,margin=bounds.width<900?15:30;
 const w=Math.min(440,bounds.width*.45),h=Math.min(hud.scrollHeight,bounds.height-top-35);
 const overlap=left=>Math.max(0,Math.min(left+w,actor.right)-Math.max(left,actor.left))*Math.max(0,Math.min(top+h,actor.bottom)-Math.max(top,actor.top));
 const leftScore=overlap(margin),rightScore=overlap(bounds.width-margin-w);
 const current=hudSide==='left'?leftScore:rightScore,other=hudSide==='left'?rightScore:leftScore;
 if(current>other+400)hudSide=hudSide==='left'?'right':'left';
 hud.classList.toggle('hud-right',hudSide==='right');
 hud.style.setProperty('--hud-width',w+'px');
 // When both corners touch the actor, use horizontal space rather than
 // collapsing the panel's height and hiding its navigation.
 const gaps={left:Math.max(0,actor.left-margin-14),right:Math.max(0,bounds.width-margin-actor.right-14)};
 if(leftScore>0&&rightScore>0){
  const roomier=gaps.left>=gaps.right?'left':'right';
  if(gaps[roomier]>=260){hudSide=roomier;hud.classList.toggle('hud-right',hudSide==='right');hud.style.setProperty('--hud-width',Math.min(w,gaps[roomier])+'px')}
 }
 hud.style.maxHeight=(bounds.height-top-35)+'px';
}
