const jwt = require('jsonwebtoken')
const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if(authorization && authorization.toLowerCase().startsWith('bearer ')){
        return authorization.substring(7)
    }
    return null
}

notesRouter.get('/', async (request, response) => {
    const notes = await Note.find({}).populate('user', {username: 1, name: 1})
    response.json(notes)
})

notesRouter.get('/:id', async (request, response, next) => {
    const note = await Note.findById(request.params.id)
    if(note){
        response.json(note)
    }else{
        response.status(404).end()
    }
})

notesRouter.post('/', async (request,response, next) => {
    const body = request.body
    const token = getTokenFrom(request)
    const decodedToken = token !== null ? jwt.verify(token, process.env.SECRET) : null
    if(!token || !decodedToken || !decodedToken.id){
        return response.status(401).json({error: 'token missing or invalid'})
    }
    console.log("Body: ", request.body)
    const user = await User.findById(decodedToken.id)
    console.log('UserData: ', user, "userId: ", body.userId)

    const note = new Note({
        content: body.content,
        important: body.important || false,
        date: new Date(),
        user: user._id
    })

    const saveNote = await note.save()
    user.notes = user.notes.concat(saveNote._id)
    await user.save()

    response.json(saveNote)
})

notesRouter.delete('/:id', async (request, response, next) => {
    await Note.findByIdAndRemove(request.params.id)
    response.status(204).end()
})

notesRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    const note = {
        content: body.content,
        important: body.important
    }

    const updateNote = await Note.findByIdAndUpdate(request.params.id, note, {new: true})
    response.json(updateNote)
})

module.exports = notesRouter