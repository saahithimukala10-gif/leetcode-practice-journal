/* ==========================================================
   AUTHENTICATION
========================================================== */

const authScreen = document.getElementById("authScreen");
const authForm = document.getElementById("authForm");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const authSubmitBtn = document.getElementById("authSubmitBtn");
const authSwitchBtn = document.getElementById("authSwitchBtn");
const authSwitchText = document.getElementById("authSwitchText");

const authMessage = document.getElementById("authMessage");

const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");

let authMode = "login";


/* ==========================================================
   SWITCH BETWEEN LOGIN AND SIGN UP
========================================================== */

authSwitchBtn.addEventListener("click", () => {

    authMessage.textContent = "";

    if (authMode === "login") {

        authMode = "signup";

        authSubmitBtn.textContent = "Sign up";
        authSwitchText.textContent = "Already have an account?";
        authSwitchBtn.textContent = "Log in";

    } else {

        authMode = "login";

        authSubmitBtn.textContent = "Log in";
        authSwitchText.textContent = "Don't have an account?";
        authSwitchBtn.textContent = "Sign up";
    }
});


/* ==========================================================
   LOGIN / SIGN UP
========================================================== */

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;

    authMessage.textContent = "";
    authSubmitBtn.disabled = true;

    try {

        if (authMode === "signup") {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });

            if (error) {
                throw error;
            }

            if (data.session) {

                authScreen.style.display = "none";

            } else {

                authMessage.textContent =
                    "Account created! Check your email to confirm your account.";
            }

        } else {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) {
                throw error;
            }

            authScreen.style.display = "none";
        }

    } catch (error) {

        authMessage.textContent = error.message;

    } finally {

        authSubmitBtn.disabled = false;
    }
});


/* ==========================================================
   LOGOUT
========================================================== */

logoutBtn.addEventListener("click", async () => {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout failed:", error.message);
        return;
    }

    authEmail.value = "";
    authPassword.value = "";

    authScreen.style.display = "flex";
});

/* ==========================================================
   SESSION
========================================================== */

async function checkSession() {

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (session) {

        userEmail.textContent = session.user.email;
        authScreen.style.display = "none";

    } else {

        userEmail.textContent = "";
        authScreen.style.display = "flex";
    }
}

/* ==========================================================
   AUTH STATE CHANGES
========================================================== */

supabaseClient.auth.onAuthStateChange((event, session) => {

    if (session) {

        userEmail.textContent = session.user.email;
        authScreen.style.display = "none";

    } else {

        userEmail.textContent = "";
        authScreen.style.display = "flex";
    }
});


/* ==========================================================
   START
========================================================== */

checkSession();