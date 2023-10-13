<template>
    <div>
        <div class="bg-light-back-secondary dark:bg-dark-back-secondary rounded-lg shadow-md p-4">
            <a v-if="ogp && url" :href="url" class="flex items-start space-x-4">
                <img v-if="ogp.image" :src="ogp.image" class="w-28 h-28 rounded-md object-cover mt-1" />
                <div>
                    <h3 class="font-semibold text-light-text-primary dark:text-dark-text-primary">{{ ogp.title }}</h3>
                    <div v-if="ogp.description !== ''">
                        <p class="text-light-text-primary dark:text-dark-text-primary">{{ ogp.description }}</p>
                    </div>
                </div>
            </a>
            <a v-else :href="url" class="flex flex-col items-start justify-start">
                <p class="font-semibold text-light-text-primary dark:text-dark-text-primary text-2xl">{{ url }}</p>
                <p class="text-light-text-primary dark:text-dark-text-primary text-sm mt-2">ogpが取得できなかったのごめんね</p>
            </a>
        </div>
    </div>
</template>




<script>
import axios from 'axios';

export default {
    props: {
        url: {
            type: String,
            default: null,
        }
    },
    data() {
        return {
            ogp: null,
            isBrowser: false,
        };
    },
    async mounted() {
        this.isBrowser = true;
        this.ogp = await this.fetchOGP(this.url);
        console.log(this.ogp)
    },
    methods: {
        async fetchOGP(url) {
            try {
                const response = await axios.get('/api/ogp', { params: { url } });
                return response.data;
            } catch (error) {
                console.error('Error fetching OGP:', error);
                return null;
            }
        }
    }
}
</script>
