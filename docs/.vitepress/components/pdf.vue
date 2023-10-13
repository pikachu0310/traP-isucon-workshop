<template>
    <div class="bg-light-back-secondary p-4 dark:bg-dark-back-secondary rounded-md">
        <div class="flex justify-center items-center">
            <vue-pdf-embed :source="source1" :page="currentPage" @loaded="onPdfLoaded" class="w-5/6 p-4" />
        </div>
        <div class="flex justify-center items-center">
            <div v-if="currentPage == 1" class="text-light-ui-secondary dark:text-dark-ui-primary opacity-50">
                <button disabled="true" @click="prevPage"
                    class="bg-light-back-primary dark:bg-dark-back-primary text-light-ui-primary dark:text-dark-ui-primary font-semibold py-2 px-4 border border-light-ui-tertiary dark:border-dark-ui-tertiary rounded shadow">
                    前のページ</button>
            </div>
            <div v-else>
                <button @click="prevPage"
                    class="bg-light-back-primary dark:bg-dark-back-primary hover:bg-light-back-tertiary dark:hover:bg-dark-back-tertiary text-light-ui-primary dark:text-dark-ui-primary font-semibold py-2 px-4 border border-light-ui-tertiary dark:border-dark-ui-tertiary rounded shadow">
                    前のページ</button>
            </div>
            <div class="mx-2"></div>
            <div
                class="bg-light-back-primary dark:bg-dark-back-primary text-light-ui-primary dark:text-dark-ui-primary font-semibold py-2 px-4  rounded shadow">
                {{ currentPage }} / {{ totalPages }}</div>
            <div class="mx-2"></div>
            <div v-if="currentPage == totalPages" class="text-light-ui-secondary dark:text-dark-ui-secondary opacity-50">
                <button disabled="true" @click="nextPage"
                    class="bg-light-back-primary dark:bg-dark-back-primary  text-light-ui-primary dark:text-dark-ui-primary font-semibold py-2 px-4 border border-light-ui-tertiary dark:border-dark-ui-tertiary rounded shadow">
                    次のページ</button>
            </div>
            <div v-else>
                <button @click="nextPage"
                    class="bg-light-back-primary dark:bg-dark-back-primary hover:bg-light-back-tertiary dark:hover:bg-dark-back-tertiary text-light-ui-primary dark:text-dark-ui-primary font-semibold py-2 px-4 border border-light-ui-tertiary dark:border-dark-ui-tertiary rounded shadow">
                    次のページ</button>
            </div>
        </div>
    </div>
</template>



<script>
import { defineClientComponent } from 'vitepress'

const VuePdfEmbed = defineClientComponent(() => {
    return import('vue-pdf-embed')
})

export default {
    components: {
        VuePdfEmbed,
    },
    props: {
        // propsでpdfのオブジェクトを受け取る
        pdfUrl: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            source1: this.pdfUrl,
            currentPage: 1, // 現在のページ
            totalPages: 0,
        }
    },
    methods: {
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
        onPdfLoaded({ numPages }) {
            this.totalPages = numPages;
        },
    },
}
</script>