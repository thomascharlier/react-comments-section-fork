import React, { useState, useEffect } from 'react'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { useContext } from 'react'
import { GlobalContext } from '../../context/Provider'
import { EditorState, ContentState, convertToRaw, Modifier } from 'draft-js'
import { Editor } from 'react-draft-wysiwyg'
import draftToHtml from 'draftjs-to-html'
import htmlToDraft from 'html-to-draftjs'
import { OrderedSet } from 'immutable'

interface AdvancedInputProps {
  formStyle?: object
  handleSubmit: (value: string) => void
  mode?: string
  cancelBtnStyle?: object
  submitBtnStyle?: object
  comId?: string
  imgStyle?: object
  imgDiv?: object
  customImg?: string
  text: string
  users: any
  placeHolder?: string
}

const AdvancedInput = ({
  formStyle,
  handleSubmit,
  submitBtnStyle,
  cancelBtnStyle,
  mode,
  comId,
  imgDiv,
  imgStyle,
  customImg,
  text,
  users,
  placeHolder
}: AdvancedInputProps) => {
  const [html, setHtml] = useState('<p></p>')
  const globalStore: any = useContext(GlobalContext)
  useEffect(() => {
    if (text != '') {
      setHtml(text)
    }
  }, [text])
  useEffect(() => {
    if (html != '<p></p>') {
      setEditor(EditorState.createWithContent(contentState))
    }
  }, [html])

  const contentBlock = htmlToDraft(html)
  const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)

  // States
  const [editorState, setEditor] = useState(EditorState.createWithContent(contentState));
  const [editText, setEditText] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState(users); 

  const onEditorStateChange = (editorState: EditorState) => {
    setEditor(editorState);
  
    const plainText = editorState.getCurrentContent().getPlainText();
    const selection = editorState.getSelection();
    const anchorOffset = selection.getAnchorOffset();
  
    // Find last "@" and extract text after it
    const lastAtIndex = plainText.lastIndexOf("@", anchorOffset);
    if (lastAtIndex !== -1) {
      const mentionText = plainText.substring(lastAtIndex + 1, anchorOffset).toLowerCase();
  
      // Show dropdown & filter users only if user types after "@"
      if (mentionText.length > 0) {
        setFilteredUsers(users.filter((user: any) =>
          user.firstName.toLowerCase().startsWith(mentionText) ||
          user.lastName.toLowerCase().startsWith(mentionText)
        ));
        setShowDropdown(filteredUsers.length > 0);
      } else {
        setFilteredUsers(users);
        setShowDropdown(true); // Show full list if "@" is alone
      }
    } else {
      setShowDropdown(false); // Hide dropdown if "@" is removed
    }
  };

  const handleSelect = (user: any) => {
    const fullName = `@${user.firstName} ${user.lastName}`;
  
    let contentState = editorState.getCurrentContent();
    let selection = editorState.getSelection();
  
    // Find the last typed "@"
    const plainText = contentState.getPlainText();
    const lastAtIndex = plainText.lastIndexOf("@");
  
    if (lastAtIndex !== -1) {
      // Create selection from "@" to the cursor position (deleting input)
      const mentionSelection = selection.merge({
        anchorOffset: lastAtIndex,
        focusOffset: selection.getAnchorOffset(), // Extend selection to the cursor
      });
  
      // Replace "@typedText" with "@Full Name"
      contentState = Modifier.replaceText(
        contentState,
        mentionSelection,
        fullName, // Insert "@Full Name"
        editorState.getCurrentInlineStyle().add("MENTION")
      );
  
      // Push updated content state
      let newEditorState = EditorState.push(editorState, contentState, "insert-characters");
  
      // Insert a space after mention
      const spaceSelection = newEditorState.getSelection();
      const spaceInsertedContent = Modifier.insertText(
        newEditorState.getCurrentContent(),
        spaceSelection,
        " ", // Insert a space
        OrderedSet() // Reset styles
      );
  
      // Push space-inserted content state
      newEditorState = EditorState.push(newEditorState, spaceInsertedContent, "insert-characters");
  
      // Reset styles so new text is normal
      newEditorState = EditorState.setInlineStyleOverride(newEditorState, OrderedSet());
  
      setEditor(newEditorState);
      setShowDropdown(false); // Hide dropdown
    }
  };
  
  /*
  const styleToHTML = (style: any) => {
    if (style === 'MENTION') {
      return <span style={{ color: "blue", fontWeight: "bold" }} />;
    }
  };
  */

  useEffect(() => {
    setEditText(
      draftToHtml(convertToRaw(editorState.getCurrentContent())).trim()
    )
  }, [editorState])

  return (
    <div className='advanced-overlay'>
      <div className='userImg' style={imgDiv}>
        <a
          target='_blank'
          href={globalStore.currentUserData.currentUserProfile}
        >
          <img
            src={
              globalStore.customImg ||
              customImg ||
              globalStore.currentUserData.currentUserImg
            }
            style={globalStore.imgStyle || imgStyle}
            alt='userIcon'
            className='imgdefault'
          />
        </a>
      </div>
      <div className='advanced-input'>
        <form
          className='form advanced-form'
          style={globalStore.formStyle || formStyle}
          onSubmit={async (e) =>
            editText != '<p></p>'
              ? (await handleSubmit(e, editText),
                setEditor(EditorState.createEmpty()))
              : null
          }
        >
          <div className='advanced-border'>
            <Editor
              editorState={editorState}
              placeholder={placeHolder ? placeHolder : 'Type your reply here.'}
              onEditorStateChange={(editorState) =>
                onEditorStateChange(editorState)
              }
              customStyleMap={{
                MENTION: { color: "blue" }
              }}
              toolbar={{
                options: [
                  'inline',
                  'blockType',
                  'list',
                  'colorPicker',
                  'link',
                  'emoji',
                  'image'
                ],
                link: {
                  inDropdown: false,
                  className: undefined,
                  component: undefined,
                  popupClassName: undefined,
                  dropdownClassName: undefined,
                  showOpenOptionOnHover: true,
                  defaultTargetOption: '_self',
                  options: ['link'],
                  linkCallback: undefined
                },
                image: {
                  className: undefined,
                  component: undefined,
                  popupClassName: undefined,
                  urlEnabled: true,
                  uploadEnabled: true,
                  alignmentEnabled: true,
                  uploadCallback: undefined,
                  previewImage: false,
                  inputAccept:
                    'image/gif,image/jpeg,image/jpg,image/png,image/svg',
                  alt: { present: false, mandatory: false },
                  defaultSize: {
                    height: 'auto',
                    width: 'auto'
                  }
                },
                inline: {
                  inDropdown: false,
                  className: undefined,
                  component: undefined,
                  dropdownClassName: undefined,
                  options: [
                    'bold',
                    'italic',
                    'underline',
                    'strikethrough',
                    'monospace'
                  ]
                },
                blockType: {
                  inDropdown: true,
                  options: ['Normal', 'Blockquote', 'Code'],
                  className: undefined,
                  component: undefined,
                  dropdownClassName: undefined
                },
                list: {
                  inDropdown: false,
                  className: undefined,
                  component: undefined,
                  dropdownClassName: undefined,
                  options: ['unordered', 'ordered']
                }
              }}
            />
          </div>

          {/* Dropdown */}
          {showDropdown && filteredUsers.length > 0 && (
            <div className="comment-dropdown-wrapper">
              <div className="comment-dropdown">
                {filteredUsers.map((user: any, index: number) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => handleSelect(user)}
                  >
                    <div className="user-initials">
                      <span>{user.firstName.charAt(0)} {user.lastName.charAt(0)}</span>
                    </div>
                    <div className="user-name">{user.firstName} {user.lastName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* <div
            dangerouslySetInnerHTML={{
              __html: text
            }}
          /> */}
          <div className='advanced-btns'>
            {mode && (
              <button
                className='advanced-cancel cancelBtn'
                style={globalStore.cancelBtnStyle || cancelBtnStyle}
                type='button'
                onClick={() =>
                  mode === 'editMode'
                    ? globalStore.handleAction(comId, true)
                    : globalStore.handleAction(comId, false)
                }
              >
                Cancel
              </button>
            )}
            <button
              className='advanced-post postBtn'
              type='submit'
              disabled={editText === '<p></p>' ? true : false}
              style={globalStore.submitBtnStyle || submitBtnStyle}
              onClick={async (e) =>
                editText != '<p></p>'
                  ? (await handleSubmit(e, editText),
                    setEditor(EditorState.createEmpty()))
                  : null
              }
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdvancedInput
