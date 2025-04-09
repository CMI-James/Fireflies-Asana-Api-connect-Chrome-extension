document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const setupView = document.getElementById("setup-view")
  const mainView = document.getElementById("main-view")
  const meetingsContent = document.getElementById("meetings-content")
  const settingsContent = document.getElementById("settings-content")
  const tabMeetings = document.getElementById("tab-meetings")
  const tabSettings = document.getElementById("tab-settings")
  const meetingSelect = document.getElementById("meeting-select")
  const meetingDetails = document.getElementById("meeting-details")
  const meetingDetailsContent = document.getElementById("meeting-details-content")
  const meetingLoading = document.getElementById("meeting-loading")
  const meetingSummary = document.getElementById("meeting-summary")
  const meetingNotes = document.getElementById("meeting-notes")
  const actionItems = document.getElementById("action-items")
  const asanaIntegrationCheckbox = document.getElementById("asana-integration")
  const asanaDetails = document.getElementById("asana-details")
  const workspaceSelect = document.getElementById("workspace-select")
  const projectSelect = document.getElementById("project-select")
  const mondayIntegrationCheckbox = document.getElementById("monday-integration")
  const mondayDetails = document.getElementById("monday-details")
  const mondayWorkspaceSelect = document.getElementById("monday-workspace-select")
  const mondayBoardSelect = document.getElementById("monday-board-select")
  const mondayItemSelect = document.getElementById("monday-item-select")
  const mondayCreateNewCheckbox = document.getElementById("monday-create-new")
  const mondayNewItemDiv = document.getElementById("monday-new-item")
  const mondayNewItemName = document.getElementById("monday-new-item-name")
  const statusMessage = document.getElementById("status-message")

  // API Keys Elements
  const firefliesApiKeyInput = document.getElementById("fireflies-api-key")
  const asanaApiKeyInput = document.getElementById("asana-api-key")
  const mondayApiKeyInput = document.getElementById("monday-api-key")
  const updateFirefliesApiKeyInput = document.getElementById("update-fireflies-api-key")
  const updateAsanaApiKeyInput = document.getElementById("update-asana-api-key")
  const updateMondayApiKeyInput = document.getElementById("update-monday-api-key")

  // Buttons
  const saveApiKeysBtn = document.getElementById("save-api-keys")
  const updateApiKeysBtn = document.getElementById("update-api-keys")
  const refreshMeetingsBtn = document.getElementById("refresh-meetings")
  const sendToAsanaBtn = document.getElementById("send-to-asana")

  // State variables
  let meetings = []
  let selectedMeeting = null
  let workspaces = []
  let projects = []
  let mondayWorkspaces = []
  let mondayBoards = []
  let mondayItems = []
  let isProcessing = false

  // Check if API keys are stored
  chrome.storage.sync.get(["firefliesApiKey", "asanaApiKey", "mondayApiKey"], (result) => {
    if (result.firefliesApiKey && result.asanaApiKey) {
      setupView.classList.add("hidden")
      mainView.classList.remove("hidden")
      updateFirefliesApiKeyInput.value = result.firefliesApiKey
      updateAsanaApiKeyInput.value = result.asanaApiKey

      if (result.mondayApiKey) {
        updateMondayApiKeyInput.value = result.mondayApiKey
        fetchMondayWorkspaces()
      }

      // Load meetings and workspaces
      fetchMeetings()
      fetchWorkspaces()
    }
  })

  // Save API Keys
  saveApiKeysBtn.addEventListener("click", () => {
    if (isProcessing) return

    const firefliesApiKey = firefliesApiKeyInput.value.trim()
    const asanaApiKey = asanaApiKeyInput.value.trim()
    const mondayApiKey = mondayApiKeyInput.value.trim()

    if (!firefliesApiKey || !asanaApiKey) {
      showStatus("Please enter Fireflies and Asana API keys", "error")
      return
    }

    setButtonLoading(saveApiKeysBtn, true)
    isProcessing = true

    chrome.storage.sync.set(
      {
        firefliesApiKey: firefliesApiKey,
        asanaApiKey: asanaApiKey,
        mondayApiKey: mondayApiKey,
      },
      () => {
        setupView.classList.add("hidden")
        mainView.classList.remove("hidden")
        updateFirefliesApiKeyInput.value = firefliesApiKey
        updateAsanaApiKeyInput.value = asanaApiKey
        updateMondayApiKeyInput.value = mondayApiKey

        // Load meetings and workspaces
        fetchMeetings()
        fetchWorkspaces()

        if (mondayApiKey) {
          fetchMondayWorkspaces()
        }

        setButtonLoading(saveApiKeysBtn, false)
        isProcessing = false
      },
    )
  })

  // Update API Keys
  updateApiKeysBtn.addEventListener("click", () => {
    if (isProcessing) return

    const firefliesApiKey = updateFirefliesApiKeyInput.value.trim()
    const asanaApiKey = updateAsanaApiKeyInput.value.trim()
    const mondayApiKey = updateMondayApiKeyInput.value.trim()

    if (!firefliesApiKey || !asanaApiKey) {
      showStatus("Please enter Fireflies and Asana API keys", "error")
      return
    }

    setButtonLoading(updateApiKeysBtn, true)
    isProcessing = true

    chrome.storage.sync.set(
      {
        firefliesApiKey: firefliesApiKey,
        asanaApiKey: asanaApiKey,
        mondayApiKey: mondayApiKey,
      },
      () => {
        showStatus("API keys updated successfully", "success")

        // Reload meetings and workspaces
        fetchMeetings()
        fetchWorkspaces()

        if (mondayApiKey) {
          fetchMondayWorkspaces()
        }

        setButtonLoading(updateApiKeysBtn, false)
        isProcessing = false
      },
    )
  })

  // Tab Navigation
  tabMeetings.addEventListener("click", () => {
    tabMeetings.classList.add("active")
    tabSettings.classList.remove("active")
    meetingsContent.classList.remove("hidden")
    settingsContent.classList.add("hidden")
  })

  tabSettings.addEventListener("click", () => {
    tabSettings.classList.add("active")
    tabMeetings.classList.remove("active")
    settingsContent.classList.remove("hidden")
    meetingsContent.classList.add("hidden")
  })

  // Asana Integration Toggle
  asanaIntegrationCheckbox.addEventListener("change", function () {
    if (this.checked) {
      asanaDetails.classList.remove("hidden")
    } else {
      asanaDetails.classList.add("hidden")
    }
  })

  // Monday Integration Toggle
  mondayIntegrationCheckbox.addEventListener("change", function () {
    if (this.checked) {
      mondayDetails.classList.remove("hidden")
      chrome.storage.sync.get(["mondayApiKey"], (result) => {
        if (result.mondayApiKey) {
          fetchMondayWorkspaces()
        }
      })
    } else {
      mondayDetails.classList.add("hidden")
    }
  })

  // Monday Create New Toggle
  mondayCreateNewCheckbox.addEventListener("change", function () {
    if (this.checked) {
      mondayItemSelect.disabled = true
      mondayNewItemDiv.classList.remove("hidden")

      // Pre-fill with meeting title if available
      if (selectedMeeting && selectedMeeting.title) {
        mondayNewItemName.value = selectedMeeting.title
      }
    } else {
      mondayItemSelect.disabled = false
      mondayNewItemDiv.classList.add("hidden")
    }
  })

  // Monday Workspace Selection
  mondayWorkspaceSelect.addEventListener("change", function () {
    const workspaceId = this.value
    if (workspaceId) {
      fetchMondayBoards(workspaceId)
    } else {
      mondayBoardSelect.innerHTML = '<option value="">Select board</option>'
      mondayItemSelect.innerHTML = '<option value="">Select customer</option>'
    }
  })

  // Monday Board Selection
  mondayBoardSelect.addEventListener("change", function () {
    const boardId = this.value
    if (boardId) {
      fetchMondayItems(boardId)
    } else {
      mondayItemSelect.innerHTML = '<option value="">Select customer</option>'
    }
  })

  // Refresh Meetings
  refreshMeetingsBtn.addEventListener("click", () => {
    if (isProcessing) return
    setButtonLoading(refreshMeetingsBtn, true)
    fetchMeetings()
  })

  // Meeting Selection
  meetingSelect.addEventListener("change", function () {
    const meetingId = this.value
    if (!meetingId) {
      meetingDetails.classList.add("hidden")
      return
    }

    // Show meeting details container but hide content and show loading
    meetingDetails.classList.remove("hidden")
    meetingDetailsContent.classList.add("hidden")
    meetingLoading.classList.remove("hidden")

    selectedMeeting = meetings.find((m) => m.id === meetingId)
    if (selectedMeeting) {
      fetchMeetingDetails(meetingId)

      // Pre-fill new item name if create new is checked
      if (mondayCreateNewCheckbox.checked && selectedMeeting.title) {
        mondayNewItemName.value = selectedMeeting.title
      }
    }
  })

  // Workspace Selection
  workspaceSelect.addEventListener("change", function () {
    const workspaceId = this.value
    if (workspaceId) {
      fetchProjects(workspaceId)
    } else {
      projectSelect.innerHTML = '<option value="">Select project</option>'
      projects = []
    }
  })

  // Send to Integrations
  sendToAsanaBtn.addEventListener("click", () => {
    if (isProcessing) return

    const asanaEnabled = asanaIntegrationCheckbox.checked
    const workspaceId = workspaceSelect.value
    const projectId = projectSelect.value
    const mondayEnabled = mondayIntegrationCheckbox.checked
    const mondayWorkspaceId = mondayWorkspaceSelect.value
    const mondayBoardId = mondayBoardSelect.value
    const createNewItem = mondayCreateNewCheckbox.checked
    const mondayItemId = mondayItemSelect.value
    const newItemName = mondayNewItemName.value

    if (!selectedMeeting) {
      showStatus("Please select a meeting", "error")
      return
    }

    if (asanaEnabled && (!workspaceId || !projectId)) {
      showStatus("Please select an Asana workspace and project", "error")
      return
    }

    if (mondayEnabled) {
      if (!mondayWorkspaceId || !mondayBoardId) {
        showStatus("Please select a Monday workspace and board", "error")
        return
      }

      if (!createNewItem && !mondayItemId) {
        showStatus("Please select a Monday customer/item", "error")
        return
      }

      if (createNewItem && !newItemName.trim()) {
        showStatus("Please enter a name for the new Monday item", "error")
        return
      }
    }

    if (!asanaEnabled && !mondayEnabled) {
      showStatus("Please enable at least one integration", "error")
      return
    }

    setButtonLoading(sendToAsanaBtn, true)
    isProcessing = true

    // Track results for both integrations
    let asanaResult = { success: false, message: "Asana integration disabled", isNew: false }
    let mondayResult = { success: false, message: "Monday integration disabled", isNew: false }

    // Create a promise chain for the integrations
    let integrationPromise = Promise.resolve()

    // First send to Asana if enabled
    if (asanaEnabled) {
      showStatus("Sending to Asana...", "info")
      integrationPromise = integrationPromise
        .then(() => sendToAsana(selectedMeeting, workspaceId, projectId))
        .then((result) => {
          asanaResult = result
          return result
        })
    }

    // Then send to Monday if enabled
    if (mondayEnabled) {
      integrationPromise = integrationPromise
        .then(() => {
          showStatus("Sending to Monday CRM...", "info")
          return sendToMonday(
            selectedMeeting,
            mondayBoardId,
            createNewItem ? null : mondayItemId,
            createNewItem ? newItemName : null,
          )
        })
        .then((result) => {
          mondayResult = result
          return result
        })
    }

    // Handle the final results
    integrationPromise
      .then(() => {
        // Create a detailed status message based on both results
        let statusText = ""

        if (asanaEnabled && mondayEnabled) {
          // Both integrations were used
          if (asanaResult.success && mondayResult.success) {
            statusText = `Success! `
            if (asanaResult.isNew) {
              statusText += "Meeting data sent to Asana. "
            } else if (asanaResult.actionItemsAdded) {
              statusText += "New action items sent to Asana (meeting already exists). "
            } else {
              statusText += "No new data sent to Asana (already exists). "
            }

            if (mondayResult.isNew) {
              statusText += "Meeting data sent to Monday CRM."
            } else {
              statusText += "No new data sent to Monday CRM (already exists)."
            }
            showStatus(statusText, "success")
          } else if (asanaResult.success) {
            statusText = `Partial success. `
            if (asanaResult.isNew) {
              statusText += "Meeting data sent to Asana. "
            } else if (asanaResult.actionItemsAdded) {
              statusText += "New action items sent to Asana (meeting already exists). "
            } else {
              statusText += "No new data sent to Asana (already exists). "
            }
            statusText += `Failed to send to Monday: ${mondayResult.message}`
            showStatus(statusText, "error")
          } else if (mondayResult.success) {
            statusText = `Partial success. Failed to send to Asana: ${asanaResult.message}. `
            if (mondayResult.isNew) {
              statusText += "Meeting data sent to Monday CRM."
            } else {
              statusText += "No new data sent to Monday CRM (already exists)."
            }
            showStatus(statusText, "error")
          } else {
            showStatus(
              `Failed to send to both Asana and Monday CRM. Asana: ${asanaResult.message}, Monday: ${mondayResult.message}`,
              "error",
            )
          }
        } else if (asanaEnabled) {
          // Only Asana was used
          if (asanaResult.success) {
            if (asanaResult.isNew) {
              statusText = "Success! Meeting data sent to Asana."
            } else if (asanaResult.actionItemsAdded) {
              statusText = "Success! New action items sent to Asana (meeting already exists)."
            } else {
              statusText = "No new data sent to Asana (already exists)."
            }
            showStatus(statusText, "success")
          } else {
            showStatus(`Failed to send to Asana: ${asanaResult.message}`, "error")
          }
        } else if (mondayEnabled) {
          // Only Monday was used
          if (mondayResult.success) {
            if (mondayResult.isNew) {
              statusText = "Success! Meeting data sent to Monday CRM."
            } else {
              statusText = "No new data sent to Monday CRM (already exists)."
            }
            showStatus(statusText, "success")
          } else {
            showStatus(`Failed to send to Monday CRM: ${mondayResult.message}`, "error")
          }
        }
      })
      .catch((error) => {
        showStatus(`Error: ${error.message}`, "error")
      })
      .finally(() => {
        setTimeout(() => {
          statusMessage.classList.add("hidden")
        }, 5000) // Show status for 5 seconds
        setButtonLoading(sendToAsanaBtn, false)
        isProcessing = false
      })
  })

  // Helper function to set button loading state
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add("loading")
      button.disabled = true
    } else {
      button.classList.remove("loading")
      button.disabled = false
    }
  }

  // Fetch Meetings from Fireflies.ai
  function fetchMeetings() {
    showStatus("Loading meetings...", "info")
    isProcessing = true

    chrome.storage.sync.get(["firefliesApiKey"], (result) => {
      if (!result.firefliesApiKey) {
        showStatus("Fireflies.ai API key not found", "error")
        setButtonLoading(refreshMeetingsBtn, false)
        isProcessing = false
        return
      }

      try {
        fetch("https://api.fireflies.ai/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${result.firefliesApiKey}`,
          },
          body: JSON.stringify({
            query: `
          query {
            transcripts(limit: 20) {
              id
              title
              date
              transcript_url
              sentences {
                text
                speaker_id
              }
            }
          }
        `,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`)
            }
            return response.json()
          })
          .then((data) => {
            if (data.errors) {
              throw new Error(data.errors[0].message)
            }

            meetings = data.data.transcripts

            // Sort meetings by date (newest first)
            meetings.sort((a, b) => new Date(b.date) - new Date(a.date))

            // Populate meeting select
            meetingSelect.innerHTML = '<option value="">Select a meeting</option>'
            meetings.forEach((meeting) => {
              const option = document.createElement("option")
              option.value = meeting.id
              option.textContent = `${meeting.title} (${new Date(meeting.date).toLocaleDateString()})`
              meetingSelect.appendChild(option)
            })

            showStatus("Meetings loaded successfully", "success")
            setTimeout(() => {
              statusMessage.classList.add("hidden")
            }, 3000)

            setButtonLoading(refreshMeetingsBtn, false)
            isProcessing = false
          })
          .catch((error) => {
            showStatus(`Error: ${error.message}. Please check your API key and internet connection.`, "error")
            setButtonLoading(refreshMeetingsBtn, false)
            isProcessing = false
          })
      } catch (error) {
        showStatus("Network error. Please check your internet connection.", "error")
        setButtonLoading(refreshMeetingsBtn, false)
        isProcessing = false
      }
    })
  }

  // Format notes content for better readability in Asana
  function formatNotesContent(notesContent) {
    if (!notesContent || notesContent.trim() === "") {
      return "No notes available"
    }

    // Split notes into sections
    const sections = notesContent.split(/(?=🖥️|📊|🥭|📝|🔍|📱|💻|📈|🗓️|📋|🤝|💡)/g)

    let formattedNotes = ""

    sections.forEach((section) => {
      if (section.trim() === "") return

      // Extract section title and timestamp if present
      const titleMatch = section.match(/^(.*?)($$\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$$)?/)

      if (titleMatch) {
        const sectionTitle = titleMatch[1].trim()
        const timestamp = titleMatch[2] ? titleMatch[2].trim() : ""

        // Format section title
        formattedNotes += `${sectionTitle} ${timestamp}\n`

        // Get the rest of the section content
        let content = section.substring(titleMatch[0].length).trim()

        // Remove bold formatting
        content = content.replace(/\*\*(.*?)\*\*/g, "$1")

        // Format bullet points
        const lines = content.split("\n")
        lines.forEach((line) => {
          if (line.trim()) {
            formattedNotes += `- ${line.trim()}\n`
          }
        })

        formattedNotes += "\n"
      } else {
        // If no title pattern found, just add the content with bullet points
        const lines = section.split("\n")
        lines.forEach((line) => {
          if (line.trim()) {
            formattedNotes += `- ${line.trim()}\n`
          }
        })
        formattedNotes += "\n"
      }
    })

    return formattedNotes.trim()
  }

  // Improve the cleanActionItem function to better handle all timestamp formats
  function cleanActionItem(text) {
    // Remove speaker names
    text = removeSpearkerName(text);

    // Remove timestamps in parentheses like (05:49)
    text = text.replace(/\(\d{2}:\d{2}\)/g, "");

    // Remove any text inside parentheses (including timestamps)
    text = text.replace(/\(.*?\)/g, "");

    // Remove timestamps with dollar signs like $$05:49$$
    text = text.replace(/\$\$\d{2}:\d{2}\$\$/g, "");

    return text.trim();
}


  // Fetch Meeting Details
  function fetchMeetingDetails(meetingId) {
    showStatus("Loading meeting details...", "info")
    isProcessing = true

    chrome.storage.sync.get(["firefliesApiKey"], (result) => {
      if (!result.firefliesApiKey) {
        showStatus("Fireflies.ai API key not found", "error")
        meetingLoading.classList.add("hidden")
        isProcessing = false
        return
      }

      fetch("https://api.fireflies.ai/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${result.firefliesApiKey}`,
        },
        body: JSON.stringify({
          query: `
          query {
            transcript(id: "${meetingId}") {
              id
              title
              date
              transcript_url
              sentences {
                text
                speaker_id
              }
              summary {
                overview
                action_items
                shorthand_bullet
                topics_discussed
                gist
                bullet_gist
                short_summary
              }
            }
          }
        `,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            throw new Error(data.errors[0].message)
          }

          const meeting = data.data.transcript
          selectedMeeting = meeting

          // Check if summary is available
          let summaryText = "No summary available"
          if (meeting.summary) {
            // Try different summary fields in order of preference
            summaryText =
              meeting.summary.overview ||
              meeting.summary.short_summary ||
              meeting.summary.gist ||
              "No summary available"
          } else if (meeting.sentences && meeting.sentences.length > 0) {
            // Generate a summary from the transcript sentences if no summary is available
            const summaryLength = Math.min(5, meeting.sentences.length)
            summaryText = meeting.sentences
              .slice(0, summaryLength)
              .map((s) => s.text)
              .join(" ")
          }

          // Display meeting summary
          meetingSummary.textContent = summaryText

          // Display meeting notes - use shorthand_bullet as the notes content
          let notesContent = ""
          if (meeting.summary && meeting.summary.shorthand_bullet) {
            try {
              // Try to parse as JSON if it's a string
              const parsedNotes = JSON.parse(meeting.summary.shorthand_bullet)
              if (Array.isArray(parsedNotes)) {
                notesContent = parsedNotes.join("\n")
              } else {
                notesContent = parsedNotes.toString()
              }
            } catch (e) {
              // If not JSON, use as is
              notesContent = meeting.summary.shorthand_bullet
            }
          }

          // Format the notes for display
          const formattedNotes = formatNotesContent(notesContent)

          // Display the formatted notes
          meetingNotes.innerHTML = formattedNotes.replace(/\n/g, "<br>")

          // Get action items ONLY from action_items field
          let actionItemsList = []

          if (meeting.summary && meeting.summary.action_items) {
            try {
              // Try to parse as JSON if it's a string
              actionItemsList = JSON.parse(meeting.summary.action_items)
            } catch (e) {
              // If not JSON, use as is or try to split by newlines
              actionItemsList = meeting.summary.action_items.split("\n").filter((item) => item.trim())
            }
          }

          // Process action items - remove speaker names and timestamps, and filter out empty items
          const processedActionItems = actionItemsList
            .map((item) => cleanActionItem(item))
            .filter((item) => item.trim() !== "") // Filter out empty items

          // Display action items
          actionItems.innerHTML = ""
          if (processedActionItems.length > 0) {
            processedActionItems.forEach((item, index) => {
              const actionItem = document.createElement("div")
              actionItem.className = "action-item"

              const checkbox = document.createElement("input")
              checkbox.type = "checkbox"
              checkbox.checked = true
              checkbox.dataset.index = index

              const label = document.createElement("label")
              label.textContent = item

              actionItem.appendChild(checkbox)
              actionItem.appendChild(label)
              actionItems.appendChild(actionItem)
            })
          } else {
            actionItems.textContent = "No action items found. You can still create tasks in Asana for this meeting."
          }

          // Pre-fill new item name if create new is checked
          if (mondayCreateNewCheckbox.checked && meeting.title) {
            mondayNewItemName.value = meeting.title
          }

          // Hide loading and show content
          meetingLoading.classList.add("hidden")
          meetingDetailsContent.classList.remove("hidden")

          showStatus("Meeting details loaded", "success")
          setTimeout(() => {
            statusMessage.classList.add("hidden")
          }, 3000)

          isProcessing = false
        })
        .catch((error) => {
          showStatus(`Error: ${error.message}`, "error")
          meetingLoading.classList.add("hidden")
          isProcessing = false
        })
    })
  }

  // Add this helper function after the extractActionItems function
  function removeSpearkerName(text) {
    // Remove patterns like "**Name**" (text enclosed in double asterisks) from anywhere in the text
    return text.replace(/\*\*[^*]+\*\*/g, "").trim()
  }

  // Fetch Asana Workspaces
  function fetchWorkspaces() {
    chrome.storage.sync.get(["asanaApiKey"], (result) => {
      if (!result.asanaApiKey) {
        showStatus("Asana API key not found", "error")
        return
      }

      fetch("https://app.asana.com/api/1.0/workspaces", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${result.asanaApiKey}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            throw new Error(data.errors[0].message)
          }

          workspaces = data.data

          // Populate workspace select
          workspaceSelect.innerHTML = '<option value="">Select workspace</option>'
          workspaces.forEach((workspace) => {
            const option = document.createElement("option")
            option.value = workspace.gid
            option.textContent = workspace.name
            workspaceSelect.appendChild(option)
          })
        })
        .catch((error) => {
          showStatus(`Error: ${error.message}`, "error")
        })
    })
  }

  // Fetch Monday Workspaces
  function fetchMondayWorkspaces() {
    chrome.storage.sync.get(["mondayApiKey"], (result) => {
      if (!result.mondayApiKey) {
        showStatus("Monday API key not found", "error")
        return
      }

      fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: result.mondayApiKey,
        },
        body: JSON.stringify({
          query: `query { workspaces { id name } }`,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            throw new Error(data.errors[0].message)
          }

          mondayWorkspaces = data.data.workspaces

          // Populate workspace select
          mondayWorkspaceSelect.innerHTML = '<option value="">Select workspace</option>'
          mondayWorkspaces.forEach((workspace) => {
            const option = document.createElement("option")
            option.value = workspace.id
            option.textContent = workspace.name
            mondayWorkspaceSelect.appendChild(option)
          })
        })
        .catch((error) => {
          showStatus(`Error fetching Monday workspaces: ${error.message}`, "error")
        })
    })
  }

  // Fetch Monday Boards
  function fetchMondayBoards(workspaceId) {
    chrome.storage.sync.get(["mondayApiKey"], (result) => {
      if (!result.mondayApiKey) {
        showStatus("Monday API key not found", "error")
        return
      }

      fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: result.mondayApiKey,
        },
        body: JSON.stringify({
          query: `query { boards(workspace_ids: ${workspaceId}) { id name } }`,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            throw new Error(data.errors[0].message)
          }

          mondayBoards = data.data.boards

          // Populate board select
          mondayBoardSelect.innerHTML = '<option value="">Select board</option>'
          mondayBoards.forEach((board) => {
            const option = document.createElement("option")
            option.value = board.id
            option.textContent = board.name
            mondayBoardSelect.appendChild(option)
          })
        })
        .catch((error) => {
          showStatus(`Error fetching Monday boards: ${error.message}`, "error")
        })
    })
  }

  // Fetch Monday Items (Customers)
  function fetchMondayItems(boardId) {
    chrome.storage.sync.get(["mondayApiKey"], (result) => {
      if (!result.mondayApiKey) {
        showStatus("Monday API key not found", "error")
        return
      }

      // Use the correct query format based on the successful Node.js test
      const query = `
      query {
        boards(ids: ${boardId}) {
          name
          items_page {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `

      fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: result.mondayApiKey,
        },
        body: JSON.stringify({ query }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            throw new Error(data.errors[0].message)
          }

          // Extract items from the new response structure
          if (
            data.data &&
            data.data.boards &&
            data.data.boards.length > 0 &&
            data.data.boards[0].items_page &&
            data.data.boards[0].items_page.items
          ) {
            mondayItems = data.data.boards[0].items_page.items || []

            // Populate item select
            mondayItemSelect.innerHTML = '<option value="">Select customer</option>'
            mondayItems.forEach((item) => {
              const option = document.createElement("option")
              option.value = item.id
              option.textContent = item.name
              mondayItemSelect.appendChild(option)
            })
          } else {
            mondayItemSelect.innerHTML = '<option value="">No items found</option>'
          }
        })
        .catch((error) => {
          console.error("Monday items error:", error)
          showStatus(`Error fetching Monday items: ${error.message}`, "error")
        })
    })
  }

  // Fetch Asana Projects
  function fetchProjects(workspaceId) {
    chrome.storage.sync.get(["asanaApiKey"], (result) => {
      if (!result.asanaApiKey) {
        showStatus("Asana API key not found", "error")
        return
      }

      fetch(`https://app.asana.com/api/1.0/workspaces/${workspaceId}/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${result.asanaApiKey}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.errors) {
            throw new Error(data.errors[0].message)
          }

          projects = data.data

          // Populate project select
          projectSelect.innerHTML = '<option value="">Select project</option>'
          projects.forEach((project) => {
            const option = document.createElement("option")
            option.value = project.gid
            option.textContent = project.name
            projectSelect.appendChild(option)
          })
        })
        .catch((error) => {
          showStatus(`Error: ${error.message}`, "error")
        })
    })
  }

  // Check if a meeting URL already exists in the entries
  function meetingUrlExists(meetingEntries, newMeetingUrl) {
    if (!newMeetingUrl) return false

    return meetingEntries.some((entry) => {
      return entry.url && entry.url.trim() === newMeetingUrl.trim()
    })
  }

  // Check if action item already exists in project
  async function getExistingTasks(projectId, asanaApiKey) {
    try {
      const response = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=name,notes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${asanaApiKey}`,
        },
      })

      const data = await response.json()

      if (data.errors) {
        throw new Error(data.errors[0].message)
      }

      return data.data || []
    } catch (error) {
      return []
    }
  }

  // Check if an action item already exists
  function actionItemExists(existingTasks, actionItem, meetingTitle) {
    return existingTasks.some((task) => {
      // Check if the task name matches the action item
      const nameMatch = task.name.trim() === actionItem.trim()

      // Check if the task notes mention this meeting
      const notesMatch = task.notes && task.notes.includes(meetingTitle)

      return nameMatch || (nameMatch && notesMatch)
    })
  }

  // Format date consistently
  function formatDate(dateObj) {
    try {
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
      }
      return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString()
    } catch (e) {
      return new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    }
  }

  // Send to Monday CRM
  async function sendToMonday(meeting, boardId, itemId = null, newItemName = null) {
    try {
      // Get API key
      const result = await new Promise((resolve) => {
        chrome.storage.sync.get(["mondayApiKey"], resolve)
      })

      if (!result.mondayApiKey) {
        throw new Error("Monday API key not found")
      }

      // Create a summary from available data
      let summaryText = "No summary available"
      if (meeting.summary) {
        summaryText =
          meeting.summary.overview || meeting.summary.short_summary || meeting.summary.gist || "No summary available"
      }

      // Get notes content
      let notesContent = ""
      if (meeting.summary && meeting.summary.shorthand_bullet) {
        try {
          const parsedNotes = JSON.parse(meeting.summary.shorthand_bullet)
          if (Array.isArray(parsedNotes)) {
            notesContent = parsedNotes.join("\n")
          } else {
            notesContent = parsedNotes.toString()
          }
        } catch (e) {
          notesContent = meeting.summary.shorthand_bullet
        }
      }

      // Format the notes content
      const formattedNotes = formatNotesContent(notesContent)

      // Get meeting URL
      const meetingUrl = meeting.transcript_url || `https://app.fireflies.ai/transcript/${meeting.id}`

      // Format date for the header
      const meetingDate = new Date(meeting.date)
      const formattedDate = formatDate(meetingDate)

      // Create formatted content with title and date headers
      const formattedContent = `MEETING: ${meeting.title}\nDATE: ${formattedDate}\n\nMeeting Link: ${meetingUrl}\n\nSUMMARY:\n${summaryText}\n\nNOTES:\n${formattedNotes}`

      let targetItemId = itemId
      let isNew = false

      // If we need to create a new item
      if (!itemId && newItemName) {
        const escapedItemName = newItemName.replace(/"/g, '\\"')

        // Create a new item in Monday
        const createResponse = await fetch("https://api.monday.com/v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: result.mondayApiKey,
          },
          body: JSON.stringify({
            query: `mutation {
            create_item(board_id: ${boardId}, item_name: "${escapedItemName}") {
              id
            }
          }`,
          }),
        })

        const createData = await createResponse.json()

        if (createData.errors) {
          throw new Error(createData.errors[0].message)
        }

        targetItemId = createData.data.create_item.id
        isNew = true
      }

      // Check if this meeting URL already exists in Monday updates
      if (targetItemId) {
        // Get existing updates for this item
        const updatesResponse = await fetch("https://api.monday.com/v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: result.mondayApiKey,
          },
          body: JSON.stringify({
            query: `query {
            items(ids: [${targetItemId}]) {
              updates {
                body
                created_at
              }
            }
          }`,
          }),
        })

        const updatesData = await updatesResponse.json()

        if (updatesData.data && updatesData.data.items && updatesData.data.items.length > 0) {
          const updates = updatesData.data.items[0].updates || []

          // Check if any update already contains this meeting URL
          const meetingExists = updates.some((update) => {
            return update.body && update.body.includes(meetingUrl)
          })

          if (meetingExists) {
            return { success: true, message: "Meeting already exists in Monday CRM", isNew: false }
          }
        }
      }

      // Escape quotes for GraphQL
      const escapedContent = formattedContent.replace(/"/g, '\\"').replace(/\n/g, "\\n")

      // Send the update to Monday
      await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: result.mondayApiKey,
        },
        body: JSON.stringify({
          query: `mutation {
          create_update(item_id: ${targetItemId}, body: "${escapedContent}") {
            id
          }
        }`,
        }),
      })

      return { success: true, message: "Successfully sent to Monday CRM", isNew: true }
    } catch (error) {
      return { success: false, message: error.message, isNew: false }
    }
  }

  // Send to Asana
  async function sendToAsana(meeting, workspaceId, projectId) {
    try {
      // Get API key
      const result = await new Promise((resolve) => {
        chrome.storage.sync.get(["asanaApiKey"], resolve)
      })

      if (!result.asanaApiKey) {
        return { success: false, message: "Asana API key not found", isNew: false }
      }

      // Create a summary from available data
      let summaryText = "No summary available"
      if (meeting.summary) {
        summaryText =
          meeting.summary.overview || meeting.summary.short_summary || meeting.summary.gist || "No summary available"
      } else if (meeting.sentences && meeting.sentences.length > 0) {
        const summaryLength = Math.min(10, meeting.sentences.length)
        summaryText = meeting.sentences
          .slice(0, summaryLength)
          .map((s) => s.text)
          .join(" ")
      }

      // Get notes content from shorthand_bullet
      let notesContent = ""
      if (meeting.summary && meeting.summary.shorthand_bullet) {
        try {
          // Try to parse as JSON if it's a string
          const parsedNotes = JSON.parse(meeting.summary.shorthand_bullet)
          if (Array.isArray(parsedNotes)) {
            notesContent = parsedNotes.join("\n")
          } else {
            notesContent = parsedNotes.toString()
          }
        } catch (e) {
          // If not JSON, use as is
          notesContent = meeting.summary.shorthand_bullet
        }
      }

      // Format the notes content for better readability
      const formattedNotes = formatNotesContent(notesContent)

      // Get meeting URL
      const meetingUrl = meeting.transcript_url || `https://app.fireflies.ai/transcript/${meeting.id}`

      // Format the meeting date and time for the timestamp
      const meetingDate = new Date(meeting.date)
      const timestamp = formatDate(meetingDate)

      // Create a meeting entry object with timestamp for sorting
      const meetingEntry = {
        title: meeting.title,
        date: meetingDate,
        timestamp: timestamp,
        summary: summaryText,
        topics: meeting.summary && meeting.summary.topics_discussed ? meeting.summary.topics_discussed : "",
        notes: formattedNotes,
        url: meetingUrl,
      }

      // First, get the project to check its current description
      const projectResponse = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${result.asanaApiKey}`,
        },
      })

      const projectData = await projectResponse.json()

      if (projectData.errors) {
        throw new Error(projectData.errors[0].message)
      }

      // Get existing description
      const existingDescription = projectData.data.notes || ""

      // Check if we already have a Fireflies section
      const firefliesSectionIndex = existingDescription.indexOf("=== FIREFLIES MEETING NOTES ===")
      let nonFirefliesContent = ""
      let existingFirefliesContent = ""

      if (firefliesSectionIndex !== -1) {
        // Split the content into non-Fireflies and Fireflies sections
        nonFirefliesContent = existingDescription.substring(0, firefliesSectionIndex).trim()
        existingFirefliesContent = existingDescription.substring(firefliesSectionIndex)
      } else {
        // No Fireflies section yet, preserve all existing content
        nonFirefliesContent = existingDescription
      }

      // Parse existing meeting entries if they exist
      const meetingEntries = []

      // Extract existing meeting entries
      if (existingFirefliesContent) {
        const entryRegex =
          /MEETING: (.*?)\nDATE: (.*?)(?:\n\nMeeting Link: (.*?))?(?:\n\nSUMMARY:\n(.*?))?(?:\n\nTOPICS DISCUSSED:\n(.*?))?(?:\n\nNOTES:\n(.*?))?(?:\n\n-{30,}|$)/gs
        let match

        while ((match = entryRegex.exec(existingFirefliesContent)) !== null) {
          const entryTitle = match[1]
          const entryDateStr = match[2]
          const entryUrl = match[3] || ""
          const entrySummary = match[4] || ""
          const entryTopics = match[5] || ""
          const entryNotes = match[6] || ""

          try {
            // Use current date as a fallback
            const entryDate = new Date()

            meetingEntries.push({
              title: entryTitle,
              date: entryDate,
              timestamp: entryDateStr,
              summary: entrySummary,
              topics: entryTopics,
              notes: entryNotes,
              url: entryUrl,
            })
          } catch (e) {
            // Skip this entry if date parsing fails
          }
        }
      }

      // Check if this meeting URL already exists
      if (meetingUrlExists(meetingEntries, meetingUrl)) {
        // Still process action items
        const existingTasks = await getExistingTasks(projectId, result.asanaApiKey)

        // Get selected action items
        const selectedActionItems = Array.from(document.querySelectorAll('.action-item input[type="checkbox"]:checked'))
          .map((checkbox) => {
            const index = checkbox.dataset.index
            const label = checkbox.nextElementSibling.textContent
            return label.trim()
          })
          .filter((item) => item !== "") // Filter out empty items

        // Create tasks for action items that don't already exist
        const actionItemPromises = []

        for (const item of selectedActionItems) {
          if (!actionItemExists(existingTasks, item, meeting.title)) {
            actionItemPromises.push(
              fetch("https://app.asana.com/api/1.0/tasks", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${result.asanaApiKey}`,
                },
                body: JSON.stringify({
                  data: {
                    name: item,
                    notes: `Action item from meeting: ${meeting.title}\nMeeting Link: ${meetingUrl}`,
                    projects: [projectId],
                    workspace: workspaceId,
                  },
                }),
              }).then((response) => response.json()),
            )
          }
        }

        if (actionItemPromises.length > 0) {
          await Promise.all(actionItemPromises)
          return { success: true, message: "Added new action items to Asana", isNew: false, actionItemsAdded: true }
        } else {
          return { success: true, message: "No new action items to add", isNew: false, actionItemsAdded: false }
        }
      }

      // Add the new meeting entry
      meetingEntries.push(meetingEntry)

      // Sort entries by date (newest first)
      meetingEntries.sort((a, b) => {
        // Try to parse dates from timestamps if they're strings
        let dateA, dateB

        try {
          // First try to use the date object if available
          if (a.date instanceof Date && !isNaN(a.date)) {
            dateA = a.date
          } else {
            // Extract date from timestamp string (format: MM/DD/YYYY HH:MM:SS)
            const dateParts = a.timestamp.split(" ")[0].split("/")
            const timeParts = a.timestamp.split(" ")[1].split(":")

            // Create date object (month is 0-indexed in JS Date)
            dateA = new Date(
              Number.parseInt(dateParts[2]), // year
              Number.parseInt(dateParts[0]) - 1, // month (0-indexed)
              Number.parseInt(dateParts[1]), // day
              Number.parseInt(timeParts[0]), // hour
              Number.parseInt(timeParts[1]), // minute
              Number.parseInt(timeParts[2] || 0), // second (default to 0 if not present)
            )
          }
        } catch (e) {
          // If parsing fails, use current date as fallback
          dateA = new Date()
        }

        try {
          // First try to use the date object if available
          if (b.date instanceof Date && !isNaN(b.date)) {
            dateB = b.date
          } else {
            // Extract date from timestamp string (format: MM/DD/YYYY HH:MM:SS)
            const dateParts = b.timestamp.split(" ")[0].split("/")
            const timeParts = b.timestamp.split(" ")[1].split(":")

            // Create date object (month is 0-indexed in JS Date)
            dateB = new Date(
              Number.parseInt(dateParts[2]), // year
              Number.parseInt(dateParts[0]) - 1, // month (0-indexed)
              Number.parseInt(dateParts[1]), // day
              Number.parseInt(timeParts[0]), // hour
              Number.parseInt(timeParts[1]), // minute
              Number.parseInt(timeParts[2] || 0), // second (default to 0 if not present)
            )
          }
        } catch (e) {
          // If parsing fails, use current date as fallback
          dateB = new Date()
        }

        // Compare dates (newest first)
        return dateB - dateA
      })

      // Generate the new Fireflies section
      let newFirefliesContent = "=== FIREFLIES MEETING NOTES ===\n\n"

      meetingEntries.forEach((entry, index) => {
        // Add the formatted meeting entry
        newFirefliesContent += `MEETING: ${entry.title}\n`

        // Format date consistently
        newFirefliesContent += `DATE: ${entry.timestamp}\n\n`

        // Add meeting URL if available
        if (entry.url) {
          newFirefliesContent += `Meeting Link: ${entry.url}\n\n`
        }

        newFirefliesContent += `SUMMARY:\n${entry.summary}\n\n`

        if (entry.topics) {
          newFirefliesContent += `TOPICS DISCUSSED:\n${entry.topics}\n\n`
        }

        // Always include NOTES section, even if empty
        newFirefliesContent += `NOTES:\n${entry.notes || "No notes available"}\n\n`

        // Add delimiter between entries (except for the last one)
        if (index < meetingEntries.length - 1) {
          newFirefliesContent += "------------------------------\n\n"
        }
      })

      // Add the non-Fireflies content back
      let newDescription = nonFirefliesContent.trim()

      if (newFirefliesContent.trim()) {
        if (newDescription) {
          newDescription += "\n\n"
        }
        newDescription += newFirefliesContent.trim()
      }

      // Update the project description with the new Fireflies section
      const updateResponse = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${result.asanaApiKey}`,
        },
        body: JSON.stringify({
          data: {
            notes: newDescription,
          },
        }),
      })

      const updateData = await updateResponse.json()

      if (updateData.errors) {
        throw new Error(updateData.errors[0].message)
      }

      // Still process action items
      const existingTasks = await getExistingTasks(projectId, result.asanaApiKey)

      // Get selected action items
      const selectedActionItems = Array.from(document.querySelectorAll('.action-item input[type="checkbox"]:checked'))
        .map((checkbox) => {
          const index = checkbox.dataset.index
          const label = checkbox.nextElementSibling.textContent
          return label.trim()
        })
        .filter((item) => item !== "") // Filter out empty items

      // Create tasks for action items that don't already exist
      const actionItemPromises = []

      for (const item of selectedActionItems) {
        if (!actionItemExists(existingTasks, item, meeting.title)) {
          actionItemPromises.push(
            fetch("https://app.asana.com/api/1.0/tasks", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${result.asanaApiKey}`,
              },
              body: JSON.stringify({
                data: {
                  name: item,
                  notes: `Action item from meeting: ${meeting.title}\nMeeting Link: ${meetingUrl}`,
                  projects: [projectId],
                  workspace: workspaceId,
                },
              }),
            }).then((response) => response.json()),
          )
        }
      }

      const actionItemsAdded = actionItemPromises.length > 0
      if (actionItemsAdded) {
        await Promise.all(actionItemPromises)
        return {
          success: true,
          message: "Successfully sent to Asana and added new action items",
          isNew: true,
          actionItemsAdded: true,
        }
      } else {
        return { success: true, message: "Successfully sent to Asana", isNew: true, actionItemsAdded: false }
      }
    } catch (error) {
      return { success: false, message: error.message, isNew: false, actionItemsAdded: false }
    }
  }

  // Helper function to display status messages
  function showStatus(message, type = "info") {
    statusMessage.textContent = message
    statusMessage.classList.remove("success", "error", "info", "hidden")

    if (type === "success") {
      statusMessage.classList.add("success")
    } else if (type === "error") {
      statusMessage.classList.add("error")
    } else {
      statusMessage.classList.add("info")
    }
  }
})
