<template>
    <div class="admin-post-page">
        <section class="update-form">
            <AdminPostForm :post='loadedPost' @submit="onSubmitted" />
        </section>
    </div>
</template>

<script>
    import AdminPostForm from '@/components/Admin/AdminPostForm'

    export default {
        layout: 'admin',
        middleware: ['check-auth', 'auth'],
        components: {
            AdminPostForm
        },
        async asyncData(context) {
            return await context.app.$axios.$get('/posts/' + context.params.postid + '.json')
                .then(res => {
                    return { loadedPost: { ...res, id: context.params.postid } }
                })
                .catch(e => context.error(e))
        },
        methods: {
            onSubmitted(editedPost) {
                editedPost.token = this.$store.getters.getToken
                this.$store.dispatch('editPost', editedPost)
                    .then(() => {
                        this.$router.push('/admin')
                    })
            }
        }
    }
</script>

<style scoped>
    .update-form {
        width: 90%;
        margin: 20px auto;
    }
    @media (min-width: 768px) {
        .update-form {
            width: 500px;
        }
    }
</style>