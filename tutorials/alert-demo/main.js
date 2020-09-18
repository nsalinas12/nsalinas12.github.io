window.addEventListener("DOMContentLoaded", () => {
    main();
});

function main() {
    console.log("DOM Loaded....")

    document.getElementById("alert-form").addEventListener("submit", (e) => {
        e.preventDefault();

        let message = e.target[0].value;
        e.target[0].value = "";
        if (message !== "") {
            alert(message);
        }
    });
}