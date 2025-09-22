// Site configuration
export const siteConfig = {
  // Site metadata
  name: "My Portfolio",
  owner: "Karl S Bayer",
  tagline: "I like building things that, for whatever reason, need to be built",
  description: "Disclaimer: Some of the things I've built are not good. And some of them have, in fact, been built before.",
  
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
    { name: "Stuff I've Built", href: "/astro-portfolio/projects" },
    { name: "Resume", href: "/astro-portfolio/resume" },
    { name: "Contact", href: "/astro-portfolio/#contact" }
  ]
};

export type SiteConfig = typeof siteConfig;
