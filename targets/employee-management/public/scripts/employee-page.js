// ========================
// ELEMENTS
// ========================

const editModal =
  document.querySelector(
    ".edit-modal"
  );

const editForm =
  document.querySelector(
    ".edit-form"
  );

const closeBtn =
  document.querySelector(
    ".close-btn"
  );

const addForm =
  document.querySelector(
    ".add-form"
  );

const deleteBtn =
  document.querySelector(
    ".delete-button"
  );


// ========================
// DELETE MODAL ELEMENTS
// ========================

const deleteConfirmModal =
  document.querySelector(
    "#delete-confirm-modal"
  );

const cancelDeleteBtn =
  document.querySelector(
    "#cancel-delete-btn"
  );

const confirmDeleteBtn =
  document.querySelector(
    "#confirm-delete-btn"
  );

const deleteEmployeeLabel =
  document.querySelector(
    "#delete-employee-label"
  );


// ========================
// TOAST
// ========================

function createToastContainer() {

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "app-toast";


  toast.innerHTML = `
    <div class="toast-status">
      ✓
    </div>

    <div class="toast-text">

      <strong>
        Success
      </strong>

      <span>
        Operation completed.
      </span>

    </div>

    <button
      class="toast-dismiss"
      type="button"
      aria-label="Close"
    >
      ×
    </button>
  `;


  document.body.appendChild(
    toast
  );


  toast
    .querySelector(
      ".toast-dismiss"
    )
    .addEventListener(
      "click",
      hideToast
    );


  return toast;
}


const toast =
  createToastContainer();


let toastTimer;


// ========================
// SHOW TOAST
// ========================

function showToast(
  message,
  type = "success"
) {

  clearTimeout(
    toastTimer
  );


  const status =
    toast.querySelector(
      ".toast-status"
    );

  const title =
    toast.querySelector(
      ".toast-text strong"
    );

  const text =
    toast.querySelector(
      ".toast-text span"
    );


  toast.classList.remove(
    "success",
    "error"
  );


  toast.classList.add(
    type
  );


  if (
    type === "error"
  ) {

    status.textContent =
      "!";

    title.textContent =
      "Something went wrong";

  } else {

    status.textContent =
      "✓";

    title.textContent =
      "Success";

  }


  text.textContent =
    message;


  requestAnimationFrame(
    () => {

      toast.classList.add(
        "show"
      );

    }
  );


  toastTimer =
    setTimeout(
      hideToast,
      3500
    );
}


// ========================
// HIDE TOAST
// ========================

function hideToast() {

  toast.classList.remove(
    "show"
  );

}


// ========================
// SAVE TOAST
// ========================

function saveToast(
  message,
  type = "success"
) {

  sessionStorage.setItem(
    "employeeToast",

    JSON.stringify({
      message,
      type,
    })
  );

}


// ========================
// RESTORE TOAST
// ========================

function restoreToast() {

  const savedToast =
    sessionStorage.getItem(
      "employeeToast"
    );


  if (!savedToast) {
    return;
  }


  sessionStorage.removeItem(
    "employeeToast"
  );


  try {

    const data =
      JSON.parse(
        savedToast
      );


    setTimeout(
      () => {

        showToast(
          data.message,
          data.type
        );

      },
      250
    );

  } catch (error) {

    console.error(
      "Invalid toast data:",
      error
    );

  }

}


restoreToast();


// ========================
// BUTTON LOADING
// ========================

function setButtonLoading(
  button,
  loading,
  loadingText = "Saving..."
) {

  if (!button) {
    return;
  }


  if (loading) {

    button.dataset.originalText =
      button.innerHTML;

    button.disabled =
      true;

    button.classList.add(
      "loading"
    );


    button.innerHTML = `
      <span class="button-spinner"></span>
      ${loadingText}
    `;

  } else {

    button.disabled =
      false;

    button.classList.remove(
      "loading"
    );


    if (
      button.dataset.originalText
    ) {

      button.innerHTML =
        button.dataset.originalText;

    }

  }

}


// ========================
// OPEN EDIT MODAL
// ========================

document
  .querySelectorAll(
    "tbody tr[data-employee]"
  )
  .forEach(
    (row) => {

      row.addEventListener(
        "click",
        () => {

          if (
            !editModal ||
            !editForm
          ) {
            return;
          }


          let employee;


          try {

            employee =
              JSON.parse(
                row.dataset.employee
              );

          } catch (error) {

            console.error(
              error
            );


            showToast(
              "Could not load employee information.",
              "error"
            );


            return;
          }


          const fields = {

            employeeNumber:
              "#edit-employeeNumber",

            firstName:
              "#edit-firstName",

            lastName:
              "#edit-lastName",

            extension:
              "#edit-extension",

            email:
              "#edit-email",

            officeCode:
              "#edit-officeCode",

            reportsTo:
              "#edit-reportsTo",

            jobTitle:
              "#edit-jobTitle",

          };


          Object.entries(
            fields
          )
            .forEach(
              ([
                key,
                selector,
              ]) => {

                const input =
                  document.querySelector(
                    selector
                  );


                if (!input) {
                  return;
                }


                input.value =
                  employee[key] ??
                  "";

              }
            );


          editModal
            .classList
            .add(
              "open"
            );


          document.body.style.overflow =
            "hidden";

        }
      );

    }
  );


// ========================
// CLOSE EDIT MODAL
// ========================

function closeEditModal() {

  if (!editModal) {
    return;
  }


  editModal
    .classList
    .remove(
      "open"
    );


  document.body.style.overflow =
    "";

}


if (closeBtn) {

  closeBtn.addEventListener(
    "click",
    closeEditModal
  );

}


if (editModal) {

  editModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        editModal
      ) {

        closeEditModal();

      }

    }
  );

}


// ========================
// ADD EMPLOYEE
// ========================

if (addForm) {

  addForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const submitButton =
        addForm.querySelector(
          'button[type="submit"]'
        );


      setButtonLoading(
        submitButton,
        true,
        "Adding..."
      );


      try {

        const formData =
          new URLSearchParams(
            new FormData(
              addForm
            )
          );


        const response =
          await fetch(
            addForm.action,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/x-www-form-urlencoded",

              },

              body:
                formData.toString(),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            "Add failed"
          );

        }


        saveToast(
          "Employee added successfully."
        );


        window.location.href =
          response.url ||
          "/employees";

      } catch (error) {

        console.error(
          error
        );


        showToast(
          "Unable to add employee.",
          "error"
        );


        setButtonLoading(
          submitButton,
          false
        );

      }

    }
  );

}


// ========================
// UPDATE EMPLOYEE
// ========================

if (editForm) {

  editForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const submitButton =
        editForm.querySelector(
          'button[type="submit"]'
        );


      setButtonLoading(
        submitButton,
        true,
        "Saving..."
      );


      try {

        const formData =
          new URLSearchParams(
            new FormData(
              editForm
            )
          );


        const response =
          await fetch(
            editForm.action,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/x-www-form-urlencoded",

              },

              body:
                formData.toString(),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            "Update failed"
          );

        }


        saveToast(
          "Employee updated successfully."
        );


        window.location.href =
          response.url ||
          "/employees";

      } catch (error) {

        console.error(
          error
        );


        showToast(
          "Unable to update employee.",
          "error"
        );


        setButtonLoading(
          submitButton,
          false
        );

      }

    }
  );

}


// ========================
// OPEN DELETE CONFIRM
// ========================

if (deleteBtn) {

  deleteBtn.addEventListener(
    "click",
    () => {

      const employeeNumber =
        document.querySelector(
          "#edit-employeeNumber"
        )?.value;


      const firstName =
        document.querySelector(
          "#edit-firstName"
        )?.value;


      const lastName =
        document.querySelector(
          "#edit-lastName"
        )?.value;


      if (
        !employeeNumber ||
        !deleteConfirmModal
      ) {

        showToast(
          "Employee information is missing.",
          "error"
        );


        return;
      }


      deleteConfirmModal
        .dataset
        .employeeNumber =
        employeeNumber;


      if (
        deleteEmployeeLabel
      ) {

        const fullName =
          `${firstName || ""} ${lastName || ""}`
            .trim();


        deleteEmployeeLabel
          .textContent =
          fullName
            ? `${fullName} (#${employeeNumber})`
            : `employee #${employeeNumber}`;

      }


      deleteConfirmModal
        .classList
        .add(
          "open"
        );

    }
  );

}


// ========================
// CLOSE DELETE MODAL
// ========================

function closeDeleteModal() {

  if (
    !deleteConfirmModal
  ) {
    return;
  }


  deleteConfirmModal
    .classList
    .remove(
      "open"
    );

}


if (cancelDeleteBtn) {

  cancelDeleteBtn
    .addEventListener(
      "click",
      closeDeleteModal
    );

}


if (deleteConfirmModal) {

  deleteConfirmModal
    .addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          deleteConfirmModal
        ) {

          closeDeleteModal();

        }

      }
    );

}


// ========================
// CONFIRM DELETE
// ========================

if (confirmDeleteBtn) {

  confirmDeleteBtn
    .addEventListener(
      "click",
      async () => {

        const employeeNumber =
          deleteConfirmModal
            ?.dataset
            ?.employeeNumber;


        if (
          !employeeNumber
        ) {

          showToast(
            "Employee number is missing.",
            "error"
          );


          return;
        }


        setButtonLoading(
          confirmDeleteBtn,
          true,
          "Deleting..."
        );


        try {

          const response =
            await fetch(
              "/employees/delete",
              {

                method:
                  "POST",

                headers: {

                  "Content-Type":
                    "application/json",

                },

                body:
                  JSON.stringify({
                    employeeNumber,
                  }),

              }
            );


          if (
            !response.ok
          ) {

            throw new Error(
              "Delete failed"
            );

          }


          saveToast(
            "Employee deleted successfully."
          );


          window.location.href =
            "/employees";

        } catch (error) {

          console.error(
            error
          );


          showToast(
            "Unable to delete employee.",
            "error"
          );


          setButtonLoading(
            confirmDeleteBtn,
            false
          );

        }

      }
    );

}


// ========================
// ESC KEY
// ========================

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }


    if (
      deleteConfirmModal
        ?.classList
        .contains(
          "open"
        )
    ) {

      closeDeleteModal();

      return;
    }


    closeEditModal();

  }
);