const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const galleryState = {
  dataset: "droid",
  visible: 8,
  order: Array.from({ length: 50 }, (_, index) => index),
  modalIndex: 0,
};

const datasets = {
  droid: {
    folder: "droid_T64_sink1",
    label: "DROID",
    control: "Robot actions",
  },
  re10k: {
    folder: "re10k_T64_sink1",
    label: "RealEstate10K",
    control: "Camera poses",
  },
};

const results = {
  droid: {
    title: "Results on DROID",
    description:
      "MiniWorld improves appearance, dynamics, geometry, VLM-based quality, and frame-level fidelity over the bidirectional baseline.",
    image: "assets/fig_main_droid.png",
    alt: "DROID quantitative results",
  },
  re10k: {
    title: "Results on RealEstate10K",
    description:
      "The same streaming architecture transfers to camera-conditioned scene prediction, improving geometric consistency and visual fidelity.",
    image: "assets/fig_main_re10k.png",
    alt: "RealEstate10K quantitative results",
  },
  ablation: {
    title: "Quality ablations",
    description:
      "Ablations study classifier-free guidance, rollout horizon, online denoising windows, retained cache size, and persistent sink frames.",
    image: "assets/fig_ablation_quality_droidv2.png",
    alt: "MiniWorld quality ablations on DROID",
  },
  throughput: {
    title: "Streaming throughput",
    description:
      "Bounding the active denoising window and reusing committed history more than doubles steady output throughput while preserving generation quality.",
    image: "assets/fig_ablation_throughput.png",
    alt: "MiniWorld streaming throughput analysis",
  },
};

const bibtex = `@article{zhao2026miniworld,
  title   = {MiniWorld: Democratizing the Training of Video World Models from Scratch},
  author  = {Zhao, Yian and Zheng, Ruochong and Guo, Hongcan and Yan, Yu and Zhang, Jian and Chen, Jie},
  year    = {2026}
}`;

const videoPath = (dataset, index) =>
  `demos/${datasets[dataset].folder}/sample_${String(index).padStart(4, "0")}.mp4`;

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    elements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -35px" },
  );
  elements.forEach((element) => observer.observe(element));
}

function initHeader() {
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-button");
  const mobileMenu = document.querySelector(".mobile-menu");
  const navLinks = [...document.querySelectorAll(".site-header nav a")];
  const sections = [...document.querySelectorAll("main section[id]")];

  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 15);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("open");
      mobileMenu.setAttribute("aria-hidden", "true");
    });
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.hash === `#${visible.target.id}`);
      });
    },
    { threshold: [0.2, 0.5], rootMargin: "-20% 0px -58%" },
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

function initHeroDemo() {
  const video = document.querySelector("#hero-video");
  const frame = video.closest(".hero-video-frame");
  const title = document.querySelector("#hero-video-title");
  const buttons = document.querySelectorAll("[data-hero-demo]");
  const content = {
    droid: {
      source: "assets/demo_droid.mp4",
      title: "Action-conditioned robot manipulation",
    },
    re10k: {
      source: "assets/demo_re10k.mp4",
      title: "Camera-conditioned scene prediction",
    },
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("active")) return;
      const dataset = button.dataset.heroDemo;
      buttons.forEach((candidate) =>
        candidate.classList.toggle("active", candidate === button),
      );
      frame.classList.add("switching");
      window.setTimeout(() => {
        video.src = content[dataset].source;
        title.textContent = content[dataset].title;
        video.play().catch(() => {});
        frame.classList.remove("switching");
      }, 180);
    });
  });
}

function createGalleryItem(sampleIndex, visualIndex) {
  const dataset = datasets[galleryState.dataset];
  const item = document.createElement("article");
  item.className = "gallery-item";
  item.tabIndex = 0;
  item.style.setProperty("--index", visualIndex);
  item.setAttribute(
    "aria-label",
    `Open ${dataset.label} rollout ${String(sampleIndex + 1).padStart(2, "0")}`,
  );

  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = videoPath(galleryState.dataset, sampleIndex);

  const meta = document.createElement("div");
  meta.className = "gallery-item-meta";
  meta.innerHTML = `
    <div>
      <span>${dataset.control}</span>
      <strong>Example ${String(sampleIndex + 1).padStart(2, "0")}</strong>
    </div>
    <i aria-hidden="true">↗</i>
  `;

  const play = () => video.play().catch(() => {});
  const pause = () => {
    video.pause();
    if (Number.isFinite(video.duration)) video.currentTime = 0;
  };

  item.addEventListener("mouseenter", play);
  item.addEventListener("mouseleave", pause);
  item.addEventListener("focus", play);
  item.addEventListener("blur", pause);
  item.addEventListener("click", () => openMediaModal(sampleIndex));
  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openMediaModal(sampleIndex);
  });

  item.append(video, meta);
  return item;
}

function renderGallery() {
  const gallery = document.querySelector("#video-gallery");
  gallery.replaceChildren();
  galleryState.order.slice(0, galleryState.visible).forEach((sampleIndex, visualIndex) => {
    gallery.append(createGalleryItem(sampleIndex, visualIndex));
  });
  document.querySelector("#gallery-count").textContent = String(galleryState.visible);
  document.querySelector("[data-load-more]").hidden = galleryState.visible >= 50;
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function initGallery() {
  const filters = document.querySelectorAll("[data-filter]");
  filters.forEach((button) => {
    button.addEventListener("click", () => {
      if (galleryState.dataset === button.dataset.filter) return;
      galleryState.dataset = button.dataset.filter;
      galleryState.visible = 8;
      galleryState.order = Array.from({ length: 50 }, (_, index) => index);
      filters.forEach((candidate) => {
        candidate.classList.toggle("active", candidate === button);
        candidate.setAttribute("aria-selected", String(candidate === button));
      });
      renderGallery();
    });
  });

  document.querySelector("[data-shuffle]").addEventListener("click", () => {
    galleryState.order = shuffled(galleryState.order);
    renderGallery();
  });

  document.querySelector("[data-load-more]").addEventListener("click", () => {
    galleryState.visible = Math.min(50, galleryState.visible + 8);
    renderGallery();
  });

  renderGallery();
}

function initMediaModal() {
  const modal = document.querySelector("#media-modal");
  modal.querySelector(".modal-close").addEventListener("click", () => modal.close());
  modal.querySelector(".previous").addEventListener("click", () => changeModalVideo(-1));
  modal.querySelector(".next").addEventListener("click", () => changeModalVideo(1));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener("close", () => {
    modal.querySelector("video").pause();
    document.body.classList.remove("modal-open");
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.open) return;
    if (event.key === "ArrowLeft") changeModalVideo(-1);
    if (event.key === "ArrowRight") changeModalVideo(1);
  });
}

function openMediaModal(sampleIndex) {
  galleryState.modalIndex = galleryState.order.indexOf(sampleIndex);
  updateModalVideo();
  document.querySelector("#media-modal").showModal();
  document.body.classList.add("modal-open");
}

function changeModalVideo(direction) {
  galleryState.modalIndex =
    (galleryState.modalIndex + direction + galleryState.order.length) %
    galleryState.order.length;
  updateModalVideo();
}

function updateModalVideo() {
  const modal = document.querySelector("#media-modal");
  const sampleIndex = galleryState.order[galleryState.modalIndex];
  const dataset = datasets[galleryState.dataset];
  const video = modal.querySelector("video");
  video.src = videoPath(galleryState.dataset, sampleIndex);
  video.play().catch(() => {});
  modal.querySelector(".modal-meta span").textContent =
    `${dataset.label} · ${dataset.control} · Streaming rollout`;
  modal.querySelector(".modal-meta strong").textContent =
    `Example ${String(sampleIndex + 1).padStart(2, "0")} / 50`;
}

function initResultTabs() {
  const buttons = document.querySelectorAll("[data-result-tab]");
  const image = document.querySelector("#result-image");
  const title = document.querySelector("#result-title");
  const description = document.querySelector("#result-description");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("active")) return;
      const result = results[button.dataset.resultTab];
      buttons.forEach((candidate) => {
        candidate.classList.toggle("active", candidate === button);
        candidate.setAttribute("aria-selected", String(candidate === button));
      });
      image.classList.add("switching");
      window.setTimeout(() => {
        title.textContent = result.title;
        description.textContent = result.description;
        image.src = result.image;
        image.alt = result.alt;
        image.classList.remove("switching");
      }, 180);
    });
  });
}

function initFigureModal() {
  const modal = document.querySelector("#figure-modal");
  document.querySelector("[data-expand-figure]").addEventListener("click", () => {
    modal.showModal();
    document.body.classList.add("modal-open");
  });
  modal.querySelector(".modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener("close", () => document.body.classList.remove("modal-open"));
}

function initCitationCopy() {
  const toast = document.querySelector(".toast");
  let timer;
  const fallback = () => {
    const textArea = document.createElement("textarea");
    textArea.value = bibtex;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  };

  document.querySelectorAll("[data-copy-citation]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(bibtex);
      } catch {
        fallback();
      }
      toast.classList.add("show");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove("show"), 1600);
    });
  });
}

initRevealAnimations();
initHeader();
initHeroDemo();
initGallery();
initMediaModal();
initResultTabs();
initFigureModal();
initCitationCopy();
