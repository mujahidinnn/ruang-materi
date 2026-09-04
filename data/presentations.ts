export type PresentationEntry = {
  slug: string;
  title: string;
  description: string;
  pptxFile: string;
};

// Hand-maintained: add a new entry here whenever a .pptx is dropped into
// public/pptx/. Order below is the display order on the site.
export const presentations: PresentationEntry[] = [
  {
    slug: "git",
    title: "Git",
    description:
      "Panduan komprehensif sistem kontrol versi, dari konsep dasar dan alur kerja harian, branching & merging, hingga kolaborasi tim profesional menggunakan repositori remote.",
    pptxFile: "Git.pptx",
  },
  {
    slug: "git-dan-github",
    title: "Git & GitHub",
    description:
      "Belajar version control dari nol sampai kolaborasi tim di GitHub, lewat studi kasus membuat akun hingga mengirim pull request.",
    pptxFile: "Git_dan_GitHub.pptx",
  },
  {
    slug: "git-dan-gitlab",
    title: "Git & GitLab",
    description:
      "Belajar version control dari konsep dasar Git sampai kolaborasi tim modern, lengkap dengan studi kasus CI/CD di GitLab.",
    pptxFile: "Git_dan_GitLab.pptx",
  },
  {
    slug: "html5",
    title: "HTML5",
    description:
      "Fondasi modern pengembangan web: struktur dokumen, elemen semantik, multimedia, hingga API terbaru di HTML5.",
    pptxFile: "HTML5.pptx",
  },
  {
    slug: "html5-dan-css3",
    title: "HTML5 dan CSS3",
    description:
      "Fondasi struktur halaman web dan penguasaan styling modern, mulai dari selector dan layout, responsive design, hingga animasi CSS3.",
    pptxFile: "HTML5_dan_CSS3.pptx",
  },
  {
    slug: "html-css-javascript",
    title: "HTML CSS JavaScript",
    description:
      "Memahami bagaimana HTML, CSS, dan JavaScript saling terhubung, dirangkai dari alur kerja nyata, studi kasus, dan praktik terbaik.",
    pptxFile: "HTML-CSS-JavaScript.pptx",
  },
  {
    slug: "javascript",
    title: "JavaScript",
    description:
      "Panduan komprehensif JavaScript dari fundamental dan ES6, hingga fitur-fitur terkini, mencakup kontrol alur, objek, dan studi kasus.",
    pptxFile: "JavaScript.pptx",
  },
  {
    slug: "reactjs",
    title: "ReactJS",
    description:
      "Library JavaScript untuk membangun antarmuka pengguna berbasis komponen, dari konsep dasar, komponen & props, state & hooks, hingga ekosistem dan deployment.",
    pptxFile: "ReactJS.pptx",
  },
  {
    slug: "vuejs",
    title: "Vue.js",
    description:
      "Progressive JavaScript framework untuk membangun antarmuka web modern yang reaktif, mencakup konsep dasar, Composition API, komponen, routing, state management, hingga deployment.",
    pptxFile: "VueJS.pptx",
  },
];
