import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

import 'spectre.css/dist/spectre-exp.css'
import 'spectre.css/dist/spectre-icons.css'
import 'spectre.css/dist/spectre.css'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
/* import specific icons */
import { faAngleLeft, faAngleRight, faCropSimple, faPen, faScissors, faUser, faFile, faPeace, faCodeCommit, faEraser, faCircleArrowDown , faArrowPointer, faWandSparkles, faGuitar, faLayerGroup, faStop, faSquarePlus as faSquarePlusSolid, faDownload, faFileImport, faCloudArrowDown, faTerminal, faSitemap, faBars, faListOl, faVectorSquare, faRotateLeft, faRotateRight, faCircleInfo, faBook} from '@fortawesome/free-solid-svg-icons'
import { faClone, faSquare, faSquarePlus, faRectangleXmark, faImages, faArrowAltCircleUp} from '@fortawesome/free-regular-svg-icons'
import router from './router'
/* add icons to the library */
library.add(faAngleLeft, faAngleRight, faClone, faCropSimple, faPen, faUser, faPeace, faArrowAltCircleUp, faCodeCommit, faFile,faCircleArrowDown, faScissors, faEraser, faArrowPointer, faSquare, faWandSparkles, faGuitar, faLayerGroup, faStop, faSquarePlus, faSquarePlusSolid, faDownload, faFileImport, faCloudArrowDown, faTerminal, faSitemap, faRectangleXmark, faImages, faBars, faListOl, faVectorSquare, faPeace, faRotateLeft, faRotateRight, faCircleInfo, faBook)

createApp(App).use(router)
  .use(store)
  .component('font-awesome-icon', FontAwesomeIcon)
  .component('font-awesome-layers', FontAwesomeLayers)
  .mount('#app')

// Restore the GitHub session from a previously stored token (fire-and-forget)
store.dispatch('auth/restoreSession')
