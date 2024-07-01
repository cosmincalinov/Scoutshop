window.addEventListener("load", () => {
    const body = document.body;

    let tema = localStorage.getItem("tema");

    if (tema) body.classList.add(tema);
    
    function schimbaTema(temaNoua) {
        body.classList.remove("dark", "alter");
        if (temaNoua) {
            body.classList.add(temaNoua);
            localStorage.setItem("tema", temaNoua);
        } else {
            localStorage.removeItem("tema");
        }
    }

    document.getElementById("schimba_tema").addEventListener("click", () => {
        schimbaTema("dark");
    });

    document.getElementById("schimba_tema2").addEventListener("click", () => {
        schimbaTema("alter");
    });

    document.getElementById("schimba_tema3").addEventListener("click", () => {
        schimbaTema(null);
    });
});