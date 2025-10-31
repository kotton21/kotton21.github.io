// Site configuration
export const siteConfig = {
  // Site metadata
  name: "Karl's Portfolio",
  owner: "Karl Scribante Bayer",
  tagline: "I like building things that, for whatever reason, need to be built",
  description: "Below lives a collection of my random things I've built. Each project posed a unique challenge and hyperfixation into some new topic I found interesting. Disclaimer: Some of the things I've built have, in fact, been built before.",
  
  // Contact information
  contact: {
    email: "karlsbayer@gmail.com",
    github: "https://github.com/kotton21",
    instagram: "https://instagram.com/karlsbayer", 
    linkedin: "https://linkedin.com/in/karl-bayer"
  },
  
  // Featured projects (in order of appearance on homepage)
  featuredProjects: [
    "arcade",
    "van_build", 
    "light_mirror"
  ],
  
  // Navigation
  navigation: [
    { name: "All Projects", href: "/projects" },
    { 
      name: "Resume", 
      href: "https://drive.google.com/file/d/1d0ciR6b7yTiw-lbge2PGQsCI4UflKEI9/view?usp=drive_link", 
      external: true, 
      target: "_blank" 
    },
    { name: "Contact", href: "/#contact" }
  ]
};

export type SiteConfig = typeof siteConfig;
