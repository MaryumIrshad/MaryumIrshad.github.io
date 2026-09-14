document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const revealItems = document.querySelectorAll(".section-label, .section-heading, .split > *, .skill-card, .research-list article, .project-card, .all-projects, .timeline article, .contact > *");

  document.body.classList.add("loaded");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  menuButton.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll(".nav-links a").forEach(link => link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
  }));

  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.transitionDelay = `${Math.min((index % 4) * 70, 210)}ms`;
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: .12, rootMargin: "0px 0px -45px" });
  revealItems.forEach(item => observer.observe(item));

  const viewerShell = document.querySelector(".katanin-viewer");
  const viewerElement = document.getElementById("katanin-3d");
  const loadingMessage = viewerShell?.querySelector(".katanin-loading");
  const resetButton = viewerShell?.querySelector(".katanin-reset");

  if (viewerShell && viewerElement && window.$3Dmol && window.KATANIN_PDB) {
    const molecularViewer = $3Dmol.createViewer(viewerElement, {
      backgroundColor: "#f3f0e8",
      backgroundAlpha: 0,
      antialias: true
    });
    const chainColors = {
      A: "#32c85a",
      B: "#ffd43b",
      C: "#ff8a2a",
      D: "#f04fb1",
      E: "#e6395f",
      F: "#3568e8"
    };

    molecularViewer.addModel(window.KATANIN_PDB, "pdb");
    Object.entries(chainColors).forEach(([chain, color]) => {
      molecularViewer.setStyle({ chain }, { cartoon: { color, thickness: 0.3 } });
    });
    molecularViewer.setStyle({ chain: "G" }, {
      stick: { color: "#00cbd6", radius: 0.68 },
      sphere: { color: "#00cbd6", scale: 0.48 }
    });
    molecularViewer.addStyle({ resn: "ATP" }, { sphere: { color: "#221c1e", radius: 1.15 } });
    molecularViewer.zoomTo();
    molecularViewer.zoom(1.15);
    molecularViewer.rotate(-12, "z");
    molecularViewer.rotate(20, "x");
    molecularViewer.render();
    molecularViewer.resize();
    viewerShell.classList.add("viewer-ready");
    if (loadingMessage) loadingMessage.textContent = "";

    const initialView = molecularViewer.getView();
    let previousPointer = null;
    let pendingX = 0;
    let pendingY = 0;
    let hoverFrame = 0;
    const renderHoverRotation = () => {
      molecularViewer.rotate(pendingX * 0.24, "vy");
      molecularViewer.rotate(-pendingY * 0.24, "vx");
      molecularViewer.render();
      pendingX = 0;
      pendingY = 0;
      hoverFrame = 0;
    };

    viewerShell.addEventListener("pointerenter", event => {
      previousPointer = { x: event.clientX, y: event.clientY };
    });
    viewerShell.addEventListener("pointermove", event => {
      if (event.pointerType === "touch" || event.buttons !== 0 || !previousPointer) {
        previousPointer = { x: event.clientX, y: event.clientY };
        return;
      }
      pendingX += event.clientX - previousPointer.x;
      pendingY += event.clientY - previousPointer.y;
      previousPointer = { x: event.clientX, y: event.clientY };
      if (!hoverFrame) hoverFrame = requestAnimationFrame(renderHoverRotation);
    });
    viewerShell.addEventListener("pointerleave", () => { previousPointer = null; });
    viewerShell.addEventListener("keydown", event => {
      const rotations = {
        ArrowLeft: [-5, "vy"],
        ArrowRight: [5, "vy"],
        ArrowUp: [-5, "vx"],
        ArrowDown: [5, "vx"]
      };
      if (event.key === "Home") {
        event.preventDefault();
        molecularViewer.setView(initialView, 350);
      } else if (rotations[event.key]) {
        event.preventDefault();
        molecularViewer.rotate(...rotations[event.key]);
        molecularViewer.render();
      }
    });
    resetButton?.addEventListener("click", () => molecularViewer.setView(initialView, 350));
    window.addEventListener("resize", () => molecularViewer.resize(), { passive: true });
  } else if (loadingMessage) {
    loadingMessage.textContent = "Interactive structure unavailable";
  }
});
