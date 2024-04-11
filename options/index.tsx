import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { supabase } from "~core/supabase"

import type { Note } from "../types"

import "./style.css"

import {
  Button,
  ButtonGroup,
  ChakraProvider,
  Editable,
  EditablePreview,
  EditableTextarea,
  Stack,
  Tag,
  WrapItem
} from "@chakra-ui/react"

function IndexOptions() {
  const [user, setUser] = useStorage<User>({
    key: "user",
    instance: new Storage({
      area: "local"
    })
  })
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteText, setNewNoteText] = useState("")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error(error)
        return
      }
      if (data.session) {
        setUser(data.session.user)
        sendToBackground({
          name: "init-session",
          body: {
            refresh_token: data.session.refresh_token,
            access_token: data.session.access_token
          }
        })
      }
    }

    init()
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [notes])

  const handleEmailLogin = async (
    type: "LOGIN" | "SIGNUP",
    username: string,
    password: string
  ) => {
    try {
      const {
        error,
        data: { user }
      } =
        type === "LOGIN"
          ? await supabase.auth.signInWithPassword({
              email: username,
              password
            })
          : await supabase.auth.signUp({ email: username, password })

      if (error) {
        alert("Error with auth: " + error.message)
      } else if (!user) {
        alert("Signup successful, confirmation mail should be sent soon!")
      } else {
        setUser(user)
      }
    } catch (error) {
      console.log("error", error)
      alert(error.error_description || error)
    }
  }

  const fetchNotes = async () => {
    try {
      console.log("id", user.id)
      const { data: notes, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user?.id)

      if (error) {
        throw error
      }
      if (notes) {
        setNotes(notes)
      }
    } catch (error) {
      console.error("Error fetching notes:", error.message)
    }
  }

  const updateNote = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ content: content })
        .eq("id", id)

      if (error) {
        console.log("Error updating note:", error.message)
        throw error
      }

      console.log("Note updated successfully")
    } catch (error) {
      console.error("Error updating note:", error.message)
    }
  }

  const addNote = async () => {
    try {
      if (!newNoteText.trim()) return

      const { data: newNote, error } = await supabase.from("notes").insert({
        user_id: user?.id,
        content: newNoteText.trim()
      })

      if (error) {
        throw error
      }

      if (newNote) {
        setNotes([...notes, newNote[0]])
        setNewNoteText("")
      }
    } catch (error) {
      console.log("Error adding note:", error.message)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      console.log("Deleting note with id:", id)
      const { data, error } = await supabase
        .from("notes")
        .delete()
        .match({ id: Number(id) })

      if (error) {
        throw error
      }

      if (data) {
        setNotes(notes.filter((note) => note.id !== id))
      }
    } catch (error) {
      console.error("Error deleting note:", error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNotes([])
  }

  return (
    <ChakraProvider>
      <div>
        {!user ? (
          <main>
            <div className="auth-container">
              {user && (
                <>
                  <h3>
                    {user.email} - {user.id}
                  </h3>
                  <button
                    onClick={() => {
                      supabase.auth.signOut()
                      setUser(null)
                    }}>
                    Logout
                  </button>
                </>
              )}
              {!user && (
                <>
                  <label>Email </label>
                  <input
                    type="text"
                    placeholder="Your Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    colorScheme={"blue"}
                    onClick={(e) => {
                      handleEmailLogin("LOGIN", username, password)
                    }}>
                    Login
                  </Button>
                  <Button
                    onClick={(e) => {
                      handleEmailLogin("SIGNUP", username, password)
                    }}>
                    Sign up
                  </Button>

                  {/* <button
                onClick={(e) => {
                  handleOAuthLogin("github")
                }}>
                Sign in with GitHub
              </button> */}
                </>
              )}
            </div>
          </main>
        ) : (
          <div className="notes-wrapper">
            <WrapItem>
              <Tag size={"md"} key={"md"} variant="solid" colorScheme="blue">
                {user.email}
              </Tag>
            </WrapItem>
            <div>
              <h3>My Notes: {notes.length}</h3>
              <ul>
                {notes.map((note) => (
                  <li key={note.id}>
                    <Editable defaultValue={note.content}>
                      <EditablePreview />
                      <EditableTextarea />
                    </Editable>
                    <Button
                      colorScheme="blue"
                      variant="ghost"
                      size="xs"
                      onClick={() => updateNote(note.id, note.content)}>
                      Update
                    </Button>
                    <Button
                      colorScheme="blue"
                      variant="ghost"
                      size="xs"
                      onClick={() => deleteNote(note.id)}>
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Enter new note"
              />
            </div>
            <Stack spacing={4} direction="row" align="center">
              <ButtonGroup spacing={4}>
                <Button
                  onClick={handleLogout}
                  colorScheme="blue"
                  variant="ghost">
                  Logout
                </Button>
                <Button onClick={addNote} colorScheme="blue" variant="ghost">
                  Add Note
                </Button>
                <Button onClick={fetchNotes} colorScheme="blue" variant="ghost">
                  Refresh
                </Button>
              </ButtonGroup>
            </Stack>
          </div>
        )}
      </div>
    </ChakraProvider>
  )
}

export default IndexOptions
