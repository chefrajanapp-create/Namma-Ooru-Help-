import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEq_eU1IL-e8tsm9b-XiilQgkfERjbqGQ",
  authDomain: "namma-ooru-help.firebaseapp.com",
  projectId: "namma-ooru-help",
  storageBucket: "namma-ooru-help.firebasestorage.app",
  messagingSenderId: "1095550227601",
  appId: "1:1095550227601:web:7c0eb66ba2ce4086bb5b30"
};

const sampleRequests = [
  {id:"sample1",title:"Bike puncture ஆயிடுச்சு",desc:"ஒரு 10 நிமிஷம் help தேவை.",area:"Kallakurichi",priority:"normal"},
  {id:"sample2",title:"Hospital வரை அழைத்துச் செல்ல உதவி",desc:"அருகில் இருப்பவர் ஒருவர் தேவை.",area:"Kallakurichi",priority:"urgent"},
  {id:"sample3",title:"Phone charger தேவை",desc:"Type-C charger 15 நிமிஷம் borrow செய்ய வேண்டும்.",area:"Nearby",priority:"normal"}
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let data = JSON.parse(localStorage.getItem("nouh_data") || '{"points":0,"helpCount":0,"requestCount":0,"requests":[]}');
let cloudRequests = [];

const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem("nouh_data", JSON.stringify(data));
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function render() {
  $("points").textContent = "🏆 " + data.points;
  $("helpCount").textContent = data.helpCount;
  $("requestCount").textContent = data.requestCount;
  $("trust").textContent = data.helpCount >= 10 ? "Trusted" : data.helpCount >= 3 ? "Good" : "New";

  const mine = data.requests.map(x => ({...x, own:true}));
  const all = [...mine, ...cloudRequests, ...sampleRequests];

  $("requests").innerHTML = all.map(r => `
    <article class="request">
      <div class="request-top">
        <div>
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.desc)}</p>
        </div>
        <span class="badge ${r.priority === "urgent" ? "urgent" : ""}">
          ${r.priority === "urgent" ? "URGENT" : "HELP"}
        </span>
      </div>
      <p style="margin-top:9px">📍 ${escapeHtml(r.area || "Nearby")}</p>
      ${r.own
        ? '<p style="margin-top:8px;color:#16845b;font-weight:700">✓ உங்கள் request</p>'
        : `<button class="help-btn" data-id="${escapeHtml(r.id || "")}">நான் உதவி செய்கிறேன் 🤝</button>`}
    </article>
  `).join("");

  document.querySelectorAll(".help-btn").forEach(btn => {
    btn.onclick = () => acceptHelp(btn.dataset.id);
  });
}

function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function openModal(title = "🆘 எனக்கு உதவி தேவை") {
  $("modalTitle").textContent = title;
  $("modal").classList.remove("hidden");
}

function closeModal() {
  $("modal").classList.add("hidden");
}

function acceptHelp() {
  data.points += 10;
  data.helpCount += 1;
  save();
  toast("❤️ Super! Help accepted. +10 Help Points");
}

async function submitRequest() {
  const description = $("description").value.trim();
  const area = $("area").value.trim() || "Location not set";
  const priority = $("priority").value;

  if (!description) {
    toast("முதலில் என்ன உதவி வேண்டும் என்று எழுதுங்கள்");
    return;
  }

  const request = {
    title: "உதவி தேவை",
    desc: description,
    area,
    priority,
    createdAt: new Date().toISOString()
  };

  data.requests.unshift({id: Date.now(), ...request});
  data.requestCount += 1;
  save();

  try {
    await addDoc(collection(db, "helpRequests"), {
      ...request,
      createdAt: serverTimestamp()
    });
    toast("✅ Request Firebase-ல save ஆயிடுச்சு!");
  } catch (error) {
    console.error(error);
    toast("✅ Request save ஆயிடுச்சு. Firebase Rules setup பண்ணணும்.");
  }

  closeModal();
  $("description").value = "";
  $("area").value = "";
}

function listenToFirebase() {
  try {
    const q = query(collection(db, "helpRequests"), orderBy("createdAt", "desc"));

    onSnapshot(q, snapshot => {
      cloudRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      render();
    }, error => {
      console.error("Firebase:", error);
    });
  } catch (error) {
    console.error(error);
  }
}

$("needHelp").onclick = () => openModal();
$("addBtn").onclick = () => openModal();

$("nearbyBtn").onclick = () => {
  document.querySelector(".section-title").scrollIntoView({behavior:"smooth"});
  toast("📍 Nearby requests காட்டப்படுகிறது");
};

$("canHelp").onclick = () => {
  document.querySelector(".section-title").scrollIntoView({behavior:"smooth"});
  toast("🤝 அருகிலுள்ள requests-ல் Help செய்யலாம்");
};

$("refresh").onclick = () => {
  render();
  toast("🔄 Requests refreshed");
};

$("closeModal").onclick = closeModal;

$("modal").addEventListener("click", e => {
  if (e.target === $("modal")) closeModal();
});

$("submitRequest").onclick = submitRequest;

render();
listenToFirebase();
