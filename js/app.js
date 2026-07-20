

const STORAGE_KEY = "practice-journal";

/* ==========================================================
   STATE
========================================================== */

let state = {

    solved: {},

    favorites: [],

    streak: 0,

    recent: []

};

/* ==========================================================
   ELEMENTS
========================================================== */

const pages = document.querySelectorAll(".page");

const navButtons = document.querySelectorAll(".nav-btn");

const roadmapContainer =
    document.getElementById("roadmapContainer");

const favoritesContainer =
    document.getElementById("favoritesContainer");

const searchInput =
    document.getElementById("searchInput");

/* ==========================================================
   INIT
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadState();

    initNavigation();

    renderRoadmap();

    renderFavorites();

    updateDashboard();

    attachSearch();

});

/* ==========================================================
   NAVIGATION
========================================================== */

function initNavigation(){

    navButtons.forEach(button=>{

        button.addEventListener("click",()=>{

            navButtons.forEach(btn=>{

                btn.classList.remove("active");

            });

            button.classList.add("active");

            const pageName =
                button.dataset.page;

            pages.forEach(page=>{

                page.classList.remove("active");

            });

            document
                .getElementById(pageName)
                .classList.add("active");

        });

    });

}

/* ==========================================================
   STORAGE
========================================================== */

function saveState(){

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(state)

    );

}

function loadState(){

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if(saved){

        state = JSON.parse(saved);

    }

}



/* ==========================================================
   RENDER ROADMAP
========================================================== */

function renderRoadmap() {

    roadmapContainer.innerHTML = "";

    roadmap.forEach(topic => {

        const solvedCount = topic.problems.filter(problem =>
            state.solved[problem.id]
        ).length;

        const topicCard = document.createElement("div");
        topicCard.className = "topic";

        topicCard.innerHTML = `

            <div class="topic-header">

                <div class="topic-title">

                    <h2>${topic.title}</h2>

                </div>

                <div class="topic-progress">

                    ${solvedCount}/${topic.problems.length}

                </div>

            </div>

            <div class="problem-list">

            ${topic.problems.map(problem => `

                <div class="problem ${problem.difficulty.toLowerCase()}">

                    <input
                        type="checkbox"
                        ${state.solved[problem.id] ? "checked" : ""}
                        data-id="${problem.id}">

                    <div class="problem-title">

                        ${problem.title}

                    </div>

                    <div class="problem-difficulty">

                        ${problem.difficulty}

                    </div>

                    <button
                        class="favorite-btn"
                        data-id="${problem.id}">

                        ${state.favorites.includes(problem.id)
                            ? "⭐"
                            : "☆"}

                    </button>

                </div>

            `).join("")}

            </div>

        `;

        const header =
            topicCard.querySelector(".topic-header");

        const list =
            topicCard.querySelector(".problem-list");

        header.addEventListener("click", () => {

            list.classList.toggle("open");

        });

        roadmapContainer.appendChild(topicCard);

    });

    attachCheckboxEvents();

    attachFavoriteEvents();

}




/* ==========================================================
   EVENTS
========================================================== */

function attachCheckboxEvents() {

    document
        .querySelectorAll('input[type="checkbox"]')
        .forEach(box => {

            box.addEventListener("change", e => {

                const id = e.target.dataset.id;

                if (e.target.checked) {

                    state.solved[id] = true;

                    addRecentActivity(`Solved ${getProblemTitle(id)}`);

                } else {

                    delete state.solved[id];

                }

                saveState();
                
                updateDashboard();
                
                renderRoadmap();
                
                renderFavorites();

            });

        });

}

function attachFavoriteEvents() {

    document
        .querySelectorAll(".favorite-btn")
        .forEach(button => {

            button.addEventListener("click", e => {

                e.stopPropagation();

                const id = button.dataset.id;

                const index = state.favorites.indexOf(id);

                if (index === -1) {

                    state.favorites.push(id);

                } else {

                    state.favorites.splice(index, 1);

                }

                saveState();
                
                renderFavorites();
                
                renderRoadmap();

            });

        });

}

function attachSearch() {

    if (!searchInput) return;

    searchInput.oninput = () => {

        const query = searchInput.value
            .toLowerCase()
            .trim();

        document
            .querySelectorAll(".problem")
            .forEach(problem => {

                const title = problem
                    .querySelector(".problem-title")
                    .textContent
                    .toLowerCase();

                problem.style.display =
                    title.includes(query)
                        ? "grid"
                        : "none";

            });

    };

}

/* ==========================================================
   FAVORITES
========================================================== */

function renderFavorites() {

    favoritesContainer.innerHTML = "";

    if (state.favorites.length === 0) {

        favoritesContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">⭐</div>

                <h2>No favorites yet</h2>

                <p>
                    Star any problem from the roadmap
                    to see it here.
                </p>

            </div>

        `;

        return;

    }

    state.favorites.forEach(id => {

        const problem = getProblem(id);

        if (!problem) return;

        const card = document.createElement("div");

        card.className = `problem ${problem.difficulty.toLowerCase()}`;

        card.innerHTML = `

            <input
                type="checkbox"
                disabled
                ${state.solved[id] ? "checked" : ""}>

            <div class="problem-title">

                ${problem.title}

            </div>

            <div class="problem-difficulty">

                ${problem.difficulty}

            </div>

            <button
                class="favorite-btn"
                data-id="${id}">

                ⭐

            </button>

        `;

        favoritesContainer.appendChild(card);

    });

}




/* ==========================================================
   DASHBOARD
========================================================== */

function updateDashboard() {

    let totalSolved = Object.keys(state.solved).length;

    let easy = 0;
    let medium = 0;
    let hard = 0;

    roadmap.forEach(topic => {

        topic.problems.forEach(problem => {

            if (!state.solved[problem.id]) return;

            switch (problem.difficulty) {

                case "Easy":
                    easy++;
                    break;

                case "Medium":
                    medium++;
                    break;

                case "Hard":
                    hard++;
                    break;

            }

        });

    });

    const totalProblems = roadmap.reduce(

        (sum, topic) => sum + topic.problems.length,

        0

    );

    const progress = totalProblems
        ? Math.round((totalSolved / totalProblems) * 100)
        : 0;

    document.getElementById("totalSolved").textContent = totalSolved;
    document.getElementById("easySolved").textContent = easy;
    document.getElementById("mediumSolved").textContent = medium;
    document.getElementById("hardSolved").textContent = hard;

    document.getElementById("overallProgress").textContent =
        progress + "%";

    document.getElementById("completionPercent").textContent =
        progress + "%";

    document.getElementById("totalProblems").textContent =
        totalProblems;

    document.getElementById("remainingProblems").textContent =
        totalProblems - totalSolved;

    document.getElementById("streakCount").textContent =
        state.streak;

    const circumference = 327;
    const offset =
        circumference - (progress / 100) * circumference;

    document.querySelector(".progress-ring").style.strokeDashoffset =
        offset;

    document.getElementById("easyBar").style.width =
        totalSolved ? (easy / totalSolved) * 100 + "%" : "0%";

    document.getElementById("mediumBar").style.width =
        totalSolved ? (medium / totalSolved) * 100 + "%" : "0%";

    document.getElementById("hardBar").style.width =
        totalSolved ? (hard / totalSolved) * 100 + "%" : "0%";

    renderRecentActivity();

}

/* ==========================================================
   RECENT ACTIVITY
========================================================== */

function addRecentActivity(text) {

    state.recent.unshift({

        text,

        date: new Date().toLocaleDateString()

    });

    state.recent = state.recent.slice(0, 10);

}

function renderRecentActivity() {

    const list = document.getElementById("recentActivity");

    list.innerHTML = "";

    if (state.recent.length === 0) {

        list.innerHTML = "<li>No activity yet.</li>";

        return;

    }

    state.recent.forEach(item => {

        const li = document.createElement("li");

        li.textContent = `${item.text} • ${item.date}`;

        list.appendChild(li);

    });

}

/* ==========================================================
   HELPERS
========================================================== */

function getProblem(id) {

    for (const topic of roadmap) {

        const problem = topic.problems.find(
            p => p.id === id
        );

        if (problem) return problem;

    }

    return null;

}

function getProblemTitle(id) {

    const problem = getProblem(id);

    return problem ? problem.title : "";

}

