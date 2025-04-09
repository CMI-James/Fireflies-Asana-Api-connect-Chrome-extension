document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const workspaceSelect = document.getElementById("workspace-select")
    const projectSelect = document.getElementById("project-select")
    const clearDescriptionBtn = document.getElementById("clear-description")
    const backButton = document.getElementById("back-button")
    const statusMessage = document.getElementById("status-message")
  
    // State variables
    let workspaces = []
    let projects = []
  
    // Load workspaces when the page loads
    fetchWorkspaces()
  
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
  
    // Clear Description Button
    clearDescriptionBtn.addEventListener("click", () => {
      const projectId = projectSelect.value
  
      if (!projectId) {
        showStatus("Please select a project", "error")
        return
      }
  
      clearProjectDescription(projectId)
    })
  
    // Back Button
    backButton.addEventListener("click", () => {
      // Navigate back to the main popup
      window.location.href = "popup.html"
    })
  
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
            console.error("Error fetching workspaces:", error)
            showStatus(`Error: ${error.message}`, "error")
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
            console.error("Error fetching projects:", error)
            showStatus(`Error: ${error.message}`, "error")
          })
      })
    }
  
    // Clear Project Description
    function clearProjectDescription(projectId) {
      showStatus("Clearing project description...", "info")
  
      chrome.storage.sync.get(["asanaApiKey"], (result) => {
        if (!result.asanaApiKey) {
          showStatus("Asana API key not found", "error")
          return
        }
  
        // Update the project description to be completely empty
        fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${result.asanaApiKey}`,
          },
          body: JSON.stringify({
            data: {
              notes: "", // Set to empty string to clear everything
            },
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.errors) {
              throw new Error(data.errors[0].message)
            }
  
            showStatus("Successfully cleared project description!", "success")
            setTimeout(() => {
              statusMessage.classList.add("hidden")
            }, 3000)
          })
          .catch((error) => {
            console.error("Error clearing project description:", error)
            showStatus(`Error: ${error.message}`, "error")
          })
      })
    }
  
    // Show status message
    function showStatus(message, type) {
      statusMessage.textContent = message
      statusMessage.className = "status"
      statusMessage.classList.add(type)
      statusMessage.classList.remove("hidden")
    }
  })
  
  