

const STORAGE_KEY = "practice-journal";

/* ==========================================================
   STATE
========================================================== */
const openTopics = new Set();

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

document.addEventListener("DOMContentLoaded", async () => {

    await loadState();

    await loadRecentActivity();
    
    await updateStreak();

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
   SUPABASE STORAGE
========================================================== */

async function loadState() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("progress")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        console.error("Could not load progress:", error.message);
        return;
    }

    state.solved = {};
    state.favorites = [];

    data.forEach(row => {

        if (row.solved) {
            state.solved[row.problem_id] = true;
        }

        if (row.favorite) {
            state.favorites.push(row.problem_id);
        }

    });
}


/* ==========================================================
   SAVE PROBLEM
========================================================== */

async function saveProblem(id) {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const solved =
        Boolean(state.solved[id]);

    const favorite =
        state.favorites.includes(id);

    const { error } = await supabaseClient
        .from("progress")
        .upsert(
            {
                user_id: user.id,
                problem_id: id,
                solved: solved,
                favorite: favorite
            },
            {
                onConflict: "user_id,problem_id"
            }
        );

    if (error) {
        console.error("Could not save progress:", error.message);
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

            <div class="problem-list ${openTopics.has(topic.id) ? "open" : ""}">

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

                    <div class="problem-actions">

    <button
        class="favorite-btn"
        data-id="${problem.id}"
        title="Favorite">

        ${state.favorites.includes(problem.id)
            ? "⭐"
            : "☆"}

    </button>

    ${
        problem.url
            ? `
                <button
                    class="open-btn"
                    onclick="window.open('${problem.url}', '_blank')">
                    Open ↗
                </button>
            `
            : `
                <button
                    class="open-btn"
                    disabled>
                    Open
                </button>
            `
    }

</div>

                </div>

            `).join("")}

            </div>

        `;

        const header =
            topicCard.querySelector(".topic-header");

        const list =
            topicCard.querySelector(".problem-list");

        header.addEventListener("click", () => {

    const isOpen = list.classList.toggle("open");

    if (isOpen) {
        openTopics.add(topic.id);
    } else {
        openTopics.delete(topic.id);
    }

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

                    addRecentActivity(id, "solved");

                } else {

                    delete state.solved[id];

                    removeRecentActivity(id);

                }

                saveProblem(id);
                
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

                saveProblem(id);
                
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

async function loadRecentActivity() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("activity")
        .select("*")
        .eq("user_id", user.id)
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Could not load activity:", error.message);
        return;
    }

    state.recent = data.map(row => {

        const problem = getProblem(row.problem_id);

        return {
            text:
                row.action === "solved"
                    ? `Solved ${problem ? problem.title : row.problem_id}`
                    : `${row.action} ${problem ? problem.title : row.problem_id}`,

            date: new Date(row.created_at).toLocaleDateString()
        };

    });

}


/* ==========================================================
   DAILY STREAK
========================================================== */

async function updateStreak() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("activity")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("action", "solved")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not calculate streak:", error.message);
        return;
    }

    if (data.length === 0) {
        state.streak = 0;
        renderStreak();
        return;
    }

    // Get unique activity dates in the user's local timezone
    const activityDates = [
        ...new Set(
            data.map(item =>
                new Date(item.created_at).toLocaleDateString("en-CA")
            )
        )
    ];

    const today = new Date();

    const todayString =
        today.toLocaleDateString("en-CA");

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayString =
        yesterday.toLocaleDateString("en-CA");

    // A streak is active if you practiced today or yesterday
    if (
        !activityDates.includes(todayString) &&
        !activityDates.includes(yesterdayString)
    ) {
        state.streak = 0;
        renderStreak();
        return;
    }

    let streak = 0;

    const checkDate = new Date(
        activityDates.includes(todayString)
            ? today
            : yesterday
    );

    while (true) {

        const dateString =
            checkDate.toLocaleDateString("en-CA");

        if (!activityDates.includes(dateString)) {
            break;
        }

        streak++;

        checkDate.setDate(checkDate.getDate() - 1);
    }

    state.streak = streak;

    renderStreak();
}


/* ==========================================================
   RENDER STREAK
========================================================== */

function renderStreak() {

    const streakElement =
        document.getElementById("streakCount");

    if (!streakElement) return;

    streakElement.textContent = state.streak;
}

/* ==========================================================
   SAVE ACTIVITY
========================================================== */

async function addRecentActivity(problemId, action) {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const { error } = await supabaseClient
        .from("activity")
        .insert({
            user_id: user.id,
            problem_id: problemId,
            action: action
        });

    if (error) {
        console.error("Could not save activity:", error.message);
        return;
    }

    await loadRecentActivity();

    renderRecentActivity();

    await updateStreak();
}


async function removeRecentActivity(problemId) {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const { error } = await supabaseClient
        .from("activity")
        .update({
            visible: false
        })
        .eq("user_id", user.id)
        .eq("problem_id", problemId)
        .eq("action", "solved")
        .eq("visible", true);

    if (error) {
        console.error("Could not hide activity:", error.message);
        return;
    }

    await loadRecentActivity();

    renderRecentActivity();
}

/* ==========================================================
   RENDER ACTIVITY
========================================================== */

function renderRecentActivity() {

    const list = document.getElementById("recentActivity");

    if (!list) return;

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

