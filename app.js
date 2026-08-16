// Namma Ooru Help - Firebase version
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEq_eU1IL-e8tsm9b-XiilQgkfERjbqGQ",
  authDomain: "namma-ooru-help.firebaseapp.com",
  projectId: "namma-ooru-help",
  storageBucket: "namma-ooru-help.firebasestorage.app",
  messagingSenderId: "1095550227601",
  appId: "1:1095550227601:web:7c0eb66ba2ce4086bb5b30"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleRequests = [
  {
    id: "sample1",
    title: "Bike puncture ஆயிடுச்சு",
    desc: "ஒரு 10 நிமிஷம் help தேவை.",
    area: "Kallakurichi",
    priority: "normal",
    sample: true
  },
  {
    id: "sample2",
    title: "Hospital வரை அழைத்துச் செல்ல உதவி",
    desc: "அருகில் இருப்பவர் ஒருவர் தேவை.",
    area: "Kallakurichi",
    priority: "urgent",
    sample: true
  },
  {
    id: "sample3",
    title: "Phone charger தேவை",
    desc: "Type-C charger 15 நிமிஷம் borrow செய்ய வேண்டும்.",
    area: "Nearby",
    priority: "normal",
    sample: true
  }
];

let data = JSON.parse(
  localStorage.getItem("nouh_data") ||
  '{"points":0,"helpCount":0,"requestCount":0}'
);

const $ = id => document.getElementById(id);

function saveLocal() {
  localStorage.setItem("nouh_data", JSON.stringify(data));
  updateStats();
}

function updateStats() {
  if ($("points")) $("points").textContent = "🏆 " + data.points;
  if ($("helpCount")) $("helpCount").textContent = data.helpCount;
  if ($("requestCount")) $("requestCount").textContent = data.requestCount;
  if ($("trust")) {
    $("trust").textContent =
      data.helpCount >= 10 ? "Trusted" :
      data.helpCount >= 3 ? "Good" : "New";
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function renderRequests(list) {
  const box = $("requests");
  if (!box) return;

  if (!list.length) {
    box.innerHTML = `
      <article class="request">
        <h3>இப்போது requests இல்லை 👍</h3>
        <p>தேவைப்பட்டால் Help Venum மூலம் request post பண்ணலாம்.</p>
      </article>`;
    return;
  }

  box.innerHTML = list.map(r => `
    <article class="request">
      <div class="request-top">
        <div>
          <h3>${escapeHtml(r.title || "உதவி தேவை")}</h3>
          <p>${escapeHtml(r.desc || "")}</p>
        </div>
        <span class="badge ${r.priority === "urgent" ? "urgent" : ""}">
          ${r.priority === "urgent" ? "URGENT" : "HELP"}
        </span>
      </div>

      <p style="margin-top:9px">📍 ${escapeHtml(r.area || "Location not set")}</p>

      ${
        r.own
          ? '<p style="margin-top:8px;color:#16845b;font-weight:700">✓ உங்கள் request</p>'
          : r.sample
            ? '<button class="help-btn" onclick="acceptHelp()">நான் உதவி செய்கிறேன் 🤝</button>'
            : `<button class="help-btn" onclick="acceptFirebaseHelp('${r.id}')">நான் உதவி செய்கிறேன் 🤝</button>`
      }
    </article>
  `).join("");
}

function openModal(title) {
  if ($("modalTitle")) $("modalTitle").textContent = title;
  $("modal")?.classList.remove("hidden");
}

function closeModal() {
  $("modal")?.classList.add("hidden");
}

function toast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

// Demo/sample help
window.acceptHelp = function () {
  data.points += 10;
  data.helpCount += 1;
  saveLocal();
  toast("❤️ Super! Help accepted. +10 Help Points");
};

// Firebase help
window.acceptFirebaseHelp = async function (id) {
  try {
    await updateDoc(doc(db, "requests", id), {
      helpAccepted: true,
      acceptedAt: serverTimestamp(),
      helperCount: increment(1)
    });

    data.points += 10;
    data.helpCount += 1;
    saveLocal();

    toast("❤️ Super! Help accepted. +10 Help Points");
  } catch (error) {
    console.error(error);
    toast("❌ Firebase connection / Rules check பண்ணுங்க");
  }
};

async function submitRequest() {
  const description = $("description")?.value.trim();
  const area = $("area")?.value.trim() || "Location not set";
  const priority = $("priority")?.value || "normal";

  if (!description) {
    toast("முதலில் என்ன உதவி வேண்டும் என்று எழுதுங்கள்");
    return;
  }

  const btn = $("submitRequest");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Posting...";
  }

  try {
    await addDoc(collection(db, "requests"), {
      title: "உதவி தேவை",
      desc: description,
      area,
      priority,
      helpAccepted: false,
      helperCount: 0,
      createdAt: serverTimestamp()
    });

    data.requestCount += 1;
    saveLocal();

    closeModal();

    if ($("description")) $("description").value = "";
    if ($("area")) $("area").value = "";

    toast("✅ Help request Firebase-ல் post ஆயிடுச்சு!");
  } catch (error) {
    console.error("Firestore error:", error);
    toast("❌ Request save ஆகவில்லை. Firebase Rules check பண்ணுங்க");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Request Post பண்ணு";
    }
  }
}

function listenToRequests() {
  const requestsRef = collection(db, "requests");
  const requestsQuery = query(requestsRef, orderBy("createdAt", "desc"));

  onSnapshot(
    requestsQuery,
    snapshot => {
      const firebaseRequests = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        own: false,
        sample: false
      }));

      renderRequests([...firebaseRequests, ...sampleRequests]);
    },
    error => {
      console.error("Firestore listener error:", error);
      renderRequests(sampleRequests);
      toast("⚠️ Firebase Rules allow read இல்லை");
    }
  );
}

$("needHelp")?.addEventListener("click", () =>
  openModal("🆘 எனக்கு உதவி தேவை")
);

$("addBtn")?.addEventListener("click", () =>
  openModal("🆘 எனக்கு உதவி தேவை")
);

$("nearbyBtn")?.addEventListener("click", () => {
  document.querySelector(".section-title")?.scrollIntoView({
    behavior: "smooth"
  });
  toast("📍 Nearby requests காட்டப்படுகிறது");
});

$("canHelp")?.addEventListener("click", () => {
  document.querySelector(".section-title")?.scrollIntoView({
    behavior: "smooth"
  });
  toast("🤝 அருகிலுள்ள requests-ல் Help செய்யலாம்");
});

$("refresh")?.addEventListener("click", () => {
  toast("🔄 Requests refreshed");
});

$("closeModal")?.addEventListener("click", closeModal);

$("modal")?.addEventListener("click", e => {
  if (e.target === $("modal")) closeModal();
});

$("submitRequest")?.addEventListener("click", submitRequest);

updateStats();
renderRequests(sampleRequests);
listenToRequests();
