<template>
  <div class="modal active aboutModal">
    <a href="#close" class="modal-overlay" aria-label="Close" @click="closeModal"></a>
    <div class="modal-container">
      <div class="modal-header">
        <a href="#close" class="btn btn-clear float-right" aria-label="Close" @click="closeModal"></a>
        <div class="modal-title h5">
          Cartographer<span v-if="appVersion" class="version"> · v{{ appVersion }}</span>
        </div>
      </div>
      <div class="modal-body">
        <div class="content">

          <p>
            <strong>Cartographer</strong> is a platform-independent tool for linking the
            musical content of an <abbr title="Music Encoding Initiative">MEI</abbr> file
            to the corresponding regions on digital facsimiles. It lets editors draw and
            manage zones for measures and movements on page images (served locally or via
            <abbr title="International Image Interoperability Framework">IIIF</abbr>) and
            exports the resulting mapping back into MEI. Built from a single web-based
            codebase, it runs in any modern browser, as an institutionally hosted web
            service (Docker), or as a native desktop and Android application (via Tauri).
          </p>

          <h6>Resources</h6>
          <ul class="linkList">
            <li>
              <a href="https://github.com/Edirom/cartographer-app" target="_blank" rel="noopener noreferrer">
                <font-awesome-icon icon="fa-solid fa-terminal" /> Source code on GitHub
              </a>
            </li>
            <li>
              <a href="https://github.com/Edirom/cartographer-app/issues" target="_blank" rel="noopener noreferrer">
                <font-awesome-icon icon="fa-solid fa-file" /> Report an issue
              </a>
            </li>
            <li>
              <a href="https://music-encoding.org" target="_blank" rel="noopener noreferrer">
                <font-awesome-icon icon="fa-solid fa-sitemap" /> Music Encoding Initiative
              </a>
            </li>
          </ul>

          <h6>Imprint</h6>
          <address class="imprint">
            <p>
              <template v-if="imprint.institution">{{ imprint.institution }},<br /></template>
              <template v-if="imprint.street">{{ imprint.street }},<br /></template>
              <template v-if="imprint.zip || imprint.city">{{ imprint.zip }}, {{ imprint.city }},<br /></template>
              <template v-if="imprint.country">{{ imprint.country }}</template>
            </p>
            <p>
              <template v-if="imprint.contactPerson">Contact: {{ imprint.contactPerson }},<br /></template>
              <template v-if="imprint.email">E-Mail: <a :href="`mailto:${imprint.email}`">{{ imprint.email }},</a><br /></template>
              <template v-if="imprint.phone">Phone: <a :href="`tel:${imprint.phone.replace(/\s/g, '')}`">{{ imprint.phone }}</a><br /></template>
            </p>
            <p v-if="imprint.link">
              <a :href="imprint.link" target="_blank" rel="noopener noreferrer">Full imprint</a>
            </p>
          </address>

          <h6 v-if="collaborators.length">Collaborators</h6>
          <div v-if="collaborators.length" class="partnerLogos">
            <a v-for="collab in collaborators" :key="collab.url"
               :href="collab.url" target="_blank" rel="noopener noreferrer" :title="collab.name">
              <img :src="collab.logo" :alt="`${collab.name} logo`" />
            </a>
          </div>

          <p class="license">
            Licensed under the
            <a href="https://github.com/Edirom/cartographer-app/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>.
          </p>

        </div>
      </div>
      <div class="modal-footer">
        <a class="btn btn-link" href="#close" @click="closeModal">Close</a>
      </div>
    </div>
  </div>
</template>

<script>
import zenmemLogo from '@/assets/logos/zenmem_logo_de_einfarbig_ultrablau.png'
import nfdiLogo from '@/assets/logos/NFDI4C_Logo_DyptichText.png'

// Placeholders replaced with deployer-provided values by 50-configure-app.sh at
// container start (env vars APP_IMPRINT_* / APP_COLLABORATORS). A value still
// starting with '__' means no override was configured — the built-in defaults
// below are used then.
const RAW_IMPRINT = {
  institution:   '__APP_IMPRINT_INSTITUTION__',
  street:        '__APP_IMPRINT_STREET__',
  zip:           '__APP_IMPRINT_ZIP__',
  city:          '__APP_IMPRINT_CITY__',
  country:       '__APP_IMPRINT_COUNTRY__',
  phone:         '__APP_IMPRINT_PHONE__',
  contactPerson: '__APP_IMPRINT_CONTACT_PERSON__',
  email:         '__APP_IMPRINT_EMAIL__',
  link:          '__APP_IMPRINT_LINK__'
}

// JSON array of collaborator objects, e.g.
//   APP_COLLABORATORS='[{"name":"Some Uni","logo":"https://example.org/logo.png","url":"https://example.org"}]'
// Logo URLs may use the /myAppPlaceholder/ prefix; it is rewritten to the
// actual subpath at container start.
const RAW_COLLABORATORS = '__APP_COLLABORATORS__'

const DEFAULT_IMPRINT = {
  institution:   'Paderborn University, Center for Music, Edition, Media (ZenMEM)',
  street:        'Warburger Str. 100',
  zip:           '33098',
  city:          'Paderborn',
  country:       'Germany',
  phone:         '',
  contactPerson: '',
  email:         'peter.stadler@uni-paderborn.de',
  link:          ''
}

const DEFAULT_COLLABORATORS = [
  { name: 'Zentrum Musik – Edition – Medien (ZenMEM)', logo: zenmemLogo, url: 'https://zenmem.de' },
  { name: 'NFDI4Culture', logo: nfdiLogo, url: 'https://nfdi4culture.de' }
]

function resolveImprint () {
  const overridden = {}
  let anySet = false
  for (const key of Object.keys(RAW_IMPRINT)) {
    const value = RAW_IMPRINT[key]
    if (value.startsWith('__')) {
      overridden[key] = ''
    } else {
      overridden[key] = value
      anySet = true
    }
  }
  return anySet ? overridden : DEFAULT_IMPRINT
}



function resolveCollaborators () {
  if (RAW_COLLABORATORS.startsWith('__')) {
    return DEFAULT_COLLABORATORS
  }
  try {
    // decode base64 (UTF-8 safe)
    const json = decodeURIComponent(escape(atob(RAW_COLLABORATORS)))
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) {
      console.warn('APP_COLLABORATORS is not a JSON array, showing default collaborators')
      return DEFAULT_COLLABORATORS
    }
    const base = (process.env.BASE_URL || '/').replace(/\/$/, '')
    // Built from parts so the "/myAppPlaceholder" token never appears as a
    // contiguous literal here — the container's public-path sed pass would
    // otherwise rewrite it and corrupt this file.
    const placeholder = ['', 'myAppPlaceholder'].join('/')
    return parsed
      .filter(c => c && c.name && c.logo && c.url)
      .map(c => ({
        ...c,
        logo: c.logo.indexOf(placeholder) === 0 ? base + c.logo.slice(placeholder.length) : c.logo
      }))
  } catch (e) {
    console.warn('APP_COLLABORATORS could not be decoded/parsed, showing default collaborators', e)
    return DEFAULT_COLLABORATORS
  }
}
export default {
  name: 'AboutModal',
  data () {
    return {
      imprint: resolveImprint(),
      collaborators: resolveCollaborators()
    }
  },
  computed: {
    appVersion () {
      return process.env.VUE_APP_VERSION || ''
    }
  },
  methods: {
    closeModal: function () {
      this.$store.dispatch('toggleAboutModal')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/css/_variables.scss';

.aboutModal .content {
  text-align: left;

  p {
    line-height: 1.5;
  }

  h6 {
    margin-top: 1.25rem;
    margin-bottom: .5rem;
  }
}

.modal-title .version {
  color: #666666;
  font-size: .9rem;
  font-weight: normal;
}

.linkList {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    margin: .35rem 0;
  }

  a {
    color: $appColor;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    svg {
      margin-right: .4rem;
    }
  }
}

.imprint {
  font-style: normal;

  p {
    margin: 0 0 .75rem;
  }

  p:empty {
    display: none;
  }

  a {
    color: $appColor;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.partnerLogos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: .75rem;

  a {
    display: inline-flex;
    transition: transform .1s ease-in-out;

    &:hover {
      transform: translateY(-2px);
    }
  }

  img {
    height: 44px;
    width: auto;
  }
}

.license {
  border-top: $thinBorder;
  margin-top: 1.25rem;
  padding-top: .75rem;
  color: #888888;
  font-size: .8rem;
}
</style>