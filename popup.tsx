import React, { useState } from "react"

import IndexOptions from "./options/index"

const Popup: React.FC = () => {
  const [note, setNote] = useState("")

  const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(event.target.value)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Do something with the note, e.g. save it to a database
    console.log("Note:", note)
    // Close the pop-up
    // ...
  }

  return (
    <div className="popup">
      <IndexOptions />
      {/* <form onSubmit={handleSubmit}>
                <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="Enter your note..."
                />
                <button type="submit">Save</button>
            </form> */}
    </div>
  )
}

export default Popup
