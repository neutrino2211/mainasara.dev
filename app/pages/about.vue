<script setup lang="ts">
const { setPageTitle } = usePageTitle()
setPageTitle('Who is Mainasara?')

useSeoMeta({
  title: "About | Mainasara's Blog",
  description: 'About Mainasara Al-amin Tsowa',
})

const projects = [
  {
    name: 'Gecko',
    url: 'https://github.com/neutrino2211/gecko',
    description: 'An experimental systems programming language with strict type-checking and an Object-Oriented paradigm with builtin C interop',
  },
  {
    name: 'Nomad',
    url: 'https://github.com/Nomad-Network/nomad',
    description: 'A decentralised database format that aims to be the founding block of community driven decentralised experiences',
  },
  {
    name: 'go-result',
    url: 'https://github.com/neutrino2211/go-result',
    description: 'A library that adds Rust-like results to Golang',
  },
  {
    name: 'Scryer',
    url: 'https://github.com/neutrino2211/scryer',
    description: 'A network-based IDS (Intrusion Detection System)',
  },
  {
    name: 'NetworkDMZ',
    url: 'https://github.com/neutrino2211/network-dmz',
    description: 'An incident response tool that allows you to shutdown all communication in a network',
  },
  {
    name: 'EXEPatch',
    url: 'https://github.com/neutrino2211/exe-patch',
    description: 'A red team tool that aims to allow users to create malware payloads that pass as the original programs they are based off of',
  },
]

const techStack = ['Go', 'C', 'C++', 'Node.js', 'Zig', 'Gleam', 'Python', 'Typescript']
</script>

<template>
  <div id="main-content" class="page-container">

    <div class="accent-line" />

    <div class="py-12">
      <!-- Profile Image -->
      <div class="mb-8 flex justify-center">
        <img
          src="/assets/me.jpg"
          alt="Mainasara Al-amin Tsowa"
          class="h-48 w-48 rounded-full border-4 border-coral/20 object-cover dark:border-cyan-accent/20 sm:h-64 sm:w-64"
        />
      </div>

      <!-- Bio -->
      <div class="prose prose-lg mx-auto dark:prose-invert">
        <p>
          My name is <strong>Mainasara Al-amin Tsowa</strong>, I am a software engineer and cybersecurity professional based in <em class="text-coral dark:text-cyan-accent">Abuja, Nigeria</em>.
        </p>

        <p>
          I am self-admittedly a nerd. I work on many things from Malware, Reverse Engineering, Databases, Networking Tools and Operating Systems, so I am eager to share all of my little adventures on the internet.
        </p>

        <p>
          This blog aims to bring my uncommitted experimental ideas to the public because I think they are really cool and have to be good for something, right?
        </p>
      </div>

      <div class="accent-line my-12" />

      <!-- Tech Stack -->
      <section>
        <h2 class="mb-6 text-xl font-semibold text-navy dark:text-gray-100">
          What Is My Tech Stack?
        </h2>
        <p class="mb-4 text-navy/80 dark:text-gray-300">
          I mostly work with backend and systems programming languages:
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tech in techStack"
            :key="tech"
            class="rounded-full bg-card-light px-4 py-2 text-sm font-medium dark:bg-card-dark"
          >
            {{ tech }}
          </span>
        </div>
        <p class="mt-4 text-sm text-navy/60 dark:text-gray-400">
          A lot of them are hobby languages I use sometimes but hey, this is my personal space so I'll tell y'all about every single one.
        </p>
      </section>

      <div class="accent-line my-12" />

      <!-- Posting Frequency -->
      <section>
        <h2 class="mb-4 text-xl font-semibold text-navy dark:text-gray-100">
          How Often Will I Post?
        </h2>
        <p class="text-navy/80 dark:text-gray-300">
          Whenever I feel like. <span class="text-coral dark:text-cyan-accent">:)</span>
        </p>
      </section>

      <div class="accent-line my-12" />

      <!-- Projects -->
      <section>
        <h2 class="mb-6 text-xl font-semibold text-navy dark:text-gray-100">
          Projects I'm Proud Of
        </h2>
        <div class="grid gap-4">
          <a
            v-for="project in projects"
            :key="project.name"
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
            class="card group block"
          >
            <h3 class="font-semibold text-navy group-hover:text-coral dark:text-gray-100 dark:group-hover:text-cyan-accent">
              {{ project.name }}
              <Icon name="ph:arrow-square-out" class="ml-1 inline h-4 w-4 opacity-50" />
            </h3>
            <p class="mt-2 text-sm text-navy/70 dark:text-gray-300">
              {{ project.description }}
            </p>
          </a>
        </div>
      </section>

      <div class="accent-line my-12" />

      <!-- Contributions -->
      <section>
        <h2 class="mb-4 text-xl font-semibold text-navy dark:text-gray-100">
          FOSS Contributions
        </h2>
        <p class="mb-4 text-navy/80 dark:text-gray-300">
          Not my projects but I am very proud to have contributed to:
        </p>
        <ul class="space-y-3 text-navy/80 dark:text-gray-300">
          <li>
            <a
              href="https://github.com/honojs/create-hono"
              class="font-medium text-coral underline decoration-dashed underline-offset-4 hover:opacity-80 dark:text-cyan-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              create-hono
            </a>
            - Helped improve the getting started experience of the create-hono CLI
          </li>
          <li>
            <a
              href="https://rabbitu.de"
              class="font-medium text-coral underline decoration-dashed underline-offset-4 hover:opacity-80 dark:text-cyan-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              rabbitude
            </a>
            - My ongoing contribution is the <code class="rounded bg-card-light px-1.5 py-0.5 text-sm dark:bg-card-dark">vult</code> system for securely storing user credentials/data
          </li>
          <li>
            <a
              href="https://npmx.dev"
              class="font-medium text-coral underline decoration-dashed underline-offset-4 hover:opacity-80 dark:text-cyan-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              npmx.dev
            </a>
            - A fast, modern browser for the npm registry started by Daniel Roe (Nuxt team lead)
          </li>
        </ul>
      </section>

      <div class="accent-line my-12" />

      <!-- Contact -->
      <section class="text-center">
        <h2 class="mb-4 text-xl font-semibold text-navy dark:text-gray-100">
          Get In Touch
        </h2>
        <p class="mb-6 text-navy/80 dark:text-gray-300">
          You can reach me via email or send me a DM on Twitter.
        </p>
        <div class="flex justify-center gap-4">
          <a
            href="mailto:neutrino2211@gmail.com"
            class="btn btn-primary"
          >
            <Icon name="ph:envelope" class="h-5 w-5" />
            Email
          </a>
          <a
            href="https://twitter.com/neutrino2211"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost"
          >
            <Icon name="ph:twitter-logo" class="h-5 w-5" />
            Twitter
          </a>
        </div>
      </section>
    </div>
  </div>
</template>
