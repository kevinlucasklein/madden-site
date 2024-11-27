import { createApp, h, provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient } from './apollo'
import App from './App.vue'
import router from './router'  // Import router
import { FontAwesomeIcon } from './plugins/font-awesome'

const app = createApp({
    setup() {
        provide(DefaultApolloClient, apolloClient)
    },
    render: () => h(App),
})

// Register global components and plugins
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)  // Use router before mounting

app.mount('#app')