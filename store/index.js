import Cookie from 'js-cookie'

export const state = () => ({
    loadedPosts: [],
    token: null
})

export const mutations = {
    'SET_POSTS'(state, posts){
        state.loadedPosts = posts
    },
    'ADD_POST'(state, post){
        state.loadedPosts.push(post)
    },
    'EDIT_POST'(state, editedPost){
        const postIndex = state.loadedPosts.findIndex(post => post.id === editedPost.id)
        state.loadedPosts[postIndex] = editedPost
    },
    'SET_TOKEN'(state, res){
        state.token = res.idToken
        if(process.client){
            localStorage.setItem('token', res.idToken)
            localStorage.setItem('tokenExpiration', new Date().getTime() + Number.parseInt(res.expiresIn) * 1000)
        }
        Cookie.set('jwt', res.idToken)
        Cookie.set('expirationDate', new Date().getTime() + Number.parseInt(res.expiresIn) * 1000)
        this.dispatch('clearToken', Number.parseInt(res.expiresIn) * 1000)
    },
    'CLEAR_TOKEN'(state) {
        state.token = null
    },
    'INIT_AUTH'(state, req){
        let token
        let tokenExpirationDate
        if(req){
            if(!req.headers.cookie){
                return
            }
            const jwtCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith('jwt='))
            if(!jwtCookie){
                return
            }
            token = jwtCookie.split('=')[1]
            tokenExpirationDate = req.headers.cookie.split(';').find(c => c.trim().startsWith('expirationDate=')).split('=')[1]
        } else {
            token = localStorage.getItem('token')
            tokenExpirationDate = localStorage.getItem('tokenExpiration')
        }

        if(new Date().getTime() > +tokenExpirationDate || !token){
            this.dispatch('logout')
            return
        }

        const data = {
            idToken: token,
            expiresIn: +tokenExpirationDate - new Date().getTime()
        }

        this.dispatch('setToken', data)
    },
    'AUTHENTICATE_USER'(state, dataAuth){
        let authURL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + process.env.fbAPIkey
        if(dataAuth.isLogin) {
            authURL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + process.env.fbAPIkey
        }

        return this.$axios.$post(authURL, {
            email: dataAuth.email,
            password: dataAuth.password,
            returnSecureToken: true
        }).then(result => {
            this.dispatch('setToken', result)
        }).catch(e => new Error(e))
    },
    'LOGOUT'(state){
        this.dispatch('clearToken', 1000)
        Cookie.remove('jwt')
        Cookie.remove('expirationDate')
        if(process.client){
            localStorage.removeItem('token')
            localStorage.removeItem('tokenExpiration')
        }
    }
}

export const actions = {
    nuxtServerInit(vuexContext, context) {
        return this.$axios.$get('/posts.json')
            .then(res => {
                const postsArray = []
                for(const key in res) {
                    postsArray.push({ ...res[key], id: key })
                }
                vuexContext.dispatch('setPosts', postsArray)
            })
            .catch(e => context.error(e))
    },
    setPosts({ commit }, payload){
        commit('SET_POSTS', payload)
    },
    addPost({ commit }, payload){
        const createdPost = { ...payload, updatedDate: new Date() }
        return this.$axios.$post('/posts.json?auth=' + payload.token, createdPost)
            .then(result => {
                commit('ADD_POST', { ...createdPost, id: result.name })
            })
            .catch(e => console.log(e))
    },
    editPost({ commit }, payload){
        return this.$axios.$put('/posts/' + payload.id + '.json?auth=' + payload.token, { ...payload, updatedDate: new Date() })
            .then(result => {
                commit('EDIT_POST', payload)
            })
            .catch(e => console.log(e))
    },
    setToken({ commit }, payload){
        commit('SET_TOKEN', payload)
    },
    authenticateUser({ commit }, payload){
        commit('AUTHENTICATE_USER', payload)
    },
    clearToken({ commit }, duration){
        setTimeout(() => {
            commit('CLEAR_TOKEN')
        }, duration)
    },
    initAuth({ commit }, payload){
        commit('INIT_AUTH', payload)
    },
    logout({ commit }) {
        commit('LOGOUT')
    }
}

export const getters = {
    getLoadedPosts(state){
        return state.loadedPosts
    },
    getToken(state){
        return state.token
    },
    isAuthenticated(state){
        return state.token != null
    }
}