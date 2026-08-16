const sampleRequests=[
  {id:1,title:"Bike puncture ஆயிடுச்சு",desc:"ஒரு 10 நிமிஷம் help தேவை.",area:"Kallakurichi",priority:"normal"},
  {id:2,title:"Hospital வரை அழைத்துச் செல்ல உதவி",desc:"அருகில் இருப்பவர் ஒருவர் தேவை.",area:"Kallakurichi",priority:"urgent"},
  {id:3,title:"Phone charger தேவை",desc:"Type-C charger 15 நிமிஷம் borrow செய்ய வேண்டும்.",area:"Nearby",priority:"normal"}
];

let data=JSON.parse(localStorage.getItem("nouh_data")||'{"points":0,"helpCount":0,"requestCount":0,"requests":[]}');
const $=id=>document.getElementById(id);

function save(){localStorage.setItem("nouh_data",JSON.stringify(data));render();}
function render(){
  $("points").textContent="🏆 "+data.points;
  $("helpCount").textContent=data.helpCount;
  $("requestCount").textContent=data.requestCount;
  $("trust").textContent=data.helpCount>=10?"Trusted":data.helpCount>=3?"Good":"New";
  const all=[...data.requests.map(x=>({...x,own:true})),...sampleRequests];
  $("requests").innerHTML=all.map(r=>`
    <article class="request">
      <div class="request-top">
        <div><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.desc)}</p></div>
        <span class="badge ${r.priority==="urgent"?"urgent":""}">${r.priority==="urgent"?"URGENT":"HELP"}</span>
      </div>
      <p style="margin-top:9px">📍 ${escapeHtml(r.area)}</p>
      ${r.own?'<p style="margin-top:8px;color:#16845b;font-weight:700">✓ உங்கள் request</p>':'<button class="help-btn" onclick="acceptHelp()">நான் உதவி செய்கிறேன் 🤝</button>'}
    </article>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function openModal(title){$("modalTitle").textContent=title;$("modal").classList.remove("hidden");}
function closeModal(){$("modal").classList.add("hidden");}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200);}
function acceptHelp(){data.points+=10;data.helpCount+=1;save();toast("❤️ Super! Help accepted. +10 Help Points");}
$("needHelp").onclick=()=>openModal("🆘 எனக்கு உதவி தேவை");
$("addBtn").onclick=()=>openModal("🆘 எனக்கு உதவி தேவை");
$("nearbyBtn").onclick=()=>{document.querySelector(".section-title").scrollIntoView({behavior:"smooth"});toast("📍 Nearby requests காட்டப்படுகிறது");};
$("canHelp").onclick=()=>{document.querySelector(".section-title").scrollIntoView({behavior:"smooth"});toast("🤝 அருகிலுள்ள requests-ல் Help செய்யலாம்");};
$("refresh").onclick=()=>{toast("🔄 Requests refreshed");render();};
$("closeModal").onclick=closeModal;
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal();});
$("submitRequest").onclick=()=>{
  const description=$("description").value.trim(), area=$("area").value.trim()||"Location not set", priority=$("priority").value;
  if(!description){toast("முதலில் என்ன உதவி வேண்டும் என்று எழுதுங்கள்");return;}
  data.requests.unshift({id:Date.now(),title:"உதவி தேவை",desc:description,area,priority});
  data.requestCount+=1;save();closeModal();$("description").value="";$("area").value="";toast("✅ Help request post ஆயிடுச்சு!");
};
render();
