// This function helps us create dates for the next 7 days
// It's useful so patients can always book appointments in the future
function getFutureDates() {
    const dates = [];
    const today = new Date();

    // Loop through the next 7 days starting from tomorrow
    for (let i = 1; i <= 7; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        // Convert to YYYY-MM-DD format for easy comparison
        dates.push(futureDate.toISOString().split('T')[0]);
    }
    return dates;
}

// This is our main data storage - think of it as a simple database
// Everything here gets saved to localStorage so data persists between page refreshes
const mockData = {
    currentUser: null, // Tracks who's logged in right now

    // Our test patient - useful for testing the system
    patients: [
        {
            id: 1,
            name: "John Doe",
            email: "patient@test.com",
            password: "patient123",
            phone: "555-0101",
            gender: "male",
            dob: "1990-05-15" // Date of birth for age validation
        }
    ],

    // All our team member doctors with their info and availability
    doctors: [
        {
            id: 1,
            name: "Dr. Asser Fouad",
            email: "doctor@test.com", // All doctors share the same login for simplicity
            password: "doctor123",
            specialty: "Cardiology",
            phone: "555-0201",
            rating: 4.8,
            bio: "Experienced cardiologist with 15 years of practice.",
            // Using an IIFE (Immediately Invoked Function Expression) to generate dynamic dates
            availability: (() => {
                const dates = getFutureDates();
                return [
                    { date: dates[0], slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
                    { date: dates[1], slots: ["09:00", "10:00", "13:00", "14:00"] },
                    { date: dates[3], slots: ["10:00", "11:00", "15:00", "16:00"] }
                ];
            })()
        },
        {
            id: 2,
            name: "Dr. Noor Ihab",
            email: "doctor@test.com",
            password: "doctor123",
            specialty: "Dermatology",
            phone: "555-0202",
            rating: 4.9,
            bio: "Board-certified dermatologist specializing in cosmetic procedures.",
            availability: (() => {
                const dates = getFutureDates();
                return [
                    { date: dates[0], slots: ["10:00", "11:00", "14:00", "15:00", "16:00"] },
                    { date: dates[2], slots: ["09:00", "10:00", "11:00"] }
                ];
            })()
        },
        {
            id: 3,
            name: "Dr. Mohamed Mostafa",
            email: "doctor@test.com",
            password: "doctor123",
            specialty: "Pediatrics",
            phone: "555-0203",
            rating: 4.7,
            bio: "Pediatrician with a passion for children's health.",
            availability: (() => {
                const dates = getFutureDates();
                return [
                    { date: dates[1], slots: ["09:00", "10:00", "11:00", "13:00", "14:00"] },
                    { date: dates[3], slots: ["09:00", "10:00", "15:00"] }
                ];
            })()
        },
        {
            id: 4,
            name: "Dr. Mohannad Hamouda",
            email: "doctor@test.com",
            password: "doctor123",
            specialty: "Orthopedics",
            phone: "555-0204",
            rating: 4.6,
            bio: "Orthopedic surgeon with expertise in sports injuries.",
            availability: (() => {
                const dates = getFutureDates();
                return [
                    { date: dates[0], slots: ["09:00", "13:00", "14:00"] },
                    { date: dates[2], slots: ["10:00", "11:00", "14:00", "15:00"] }
                ];
            })()
        }
    ],

    // System administrator account
    admins: [
        {
            id: 1,
            name: "Admin User",
            email: "admin@hospital.com",
            password: "admin123"
        }
    ],

    // All booked appointments - starts empty and fills up as patients book
    appointments: []
};

// Utility functions - these are helper methods we use throughout the app
// Think of this as our toolbox for common operations
const utils = {
    // Save all our data to localStorage so it persists between sessions
    saveData: function() {
        localStorage.setItem('medicalSystemData', JSON.stringify(mockData));
    },

    // Load saved data from localStorage when the page loads
    // Also updates doctor availability to remove any past dates
    loadData: function() {
        const data = localStorage.getItem('medicalSystemData');
        if (data) {
            Object.assign(mockData, JSON.parse(data));
        }
        // Keep availability dates fresh - remove old dates and add new ones
        this.updateDoctorAvailabilityDates();
    },

    // This is super important! It keeps doctor schedules current
    // Removes past dates and adds new future dates automatically
    updateDoctorAvailabilityDates: function() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to midnight for accurate date comparison

        // Go through each doctor and clean up their schedule
        mockData.doctors.forEach(doctor => {
            // Remove any dates that have already passed
            doctor.availability = doctor.availability.filter(slot => {
                const slotDate = new Date(slot.date);
                slotDate.setHours(0, 0, 0, 0);
                return slotDate >= today; // Keep only today and future dates
            });

            // If a doctor has less than 3 available dates, add more
            // This ensures patients always have options to book
            if (doctor.availability.length < 3) {
                const futureDates = getFutureDates();
                const existingDates = doctor.availability.map(slot => slot.date);

                // Standard business hours - doctors are available during these times
                const defaultSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

                // Add new dates (up to 5 total) that don't already exist
                let addedCount = 0;
                for (let i = 0; i < futureDates.length && doctor.availability.length < 5; i++) {
                    if (!existingDates.includes(futureDates[i])) {
                        doctor.availability.push({
                            date: futureDates[i],
                            slots: [...defaultSlots] // Clone the array so each date has its own
                        });
                        addedCount++;
                    }
                }

                // Keep everything organized chronologically
                doctor.availability.sort((a, b) => new Date(a.date) - new Date(b.date));
            }
        });
    },

    // Get whoever is currently logged in from session storage
    getCurrentUser: function() {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Save the logged-in user to session storage
    // Session storage clears when the browser closes, which is perfect for login sessions
    setCurrentUser: function(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        mockData.currentUser = user;
    },

    // Log the user out and send them back to the login page
    logout: function() {
        sessionStorage.removeItem('currentUser');
        mockData.currentUser = null;
        window.location.href = '../index.html';
    },

    // Check if someone is logged in with the right account type
    // For example, make sure only patients can access patient pages
    requireAuth: function(userType) {
        const user = this.getCurrentUser();
        if (!user || user.type !== userType) {
            window.location.href = '../index.html'; // Not authorized? Back to login!
            return false;
        }
        return true;
    },

    // Make dates look nice and readable
    // Turns "2024-01-15" into "Monday, January 15, 2024"
    formatDate: function(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Find a specific doctor by their ID
    getDoctorById: function(id) {
        return mockData.doctors.find(doc => doc.id === parseInt(id));
    },

    // Find a specific patient by their ID
    getPatientById: function(id) {
        return mockData.patients.find(patient => patient.id === parseInt(id));
    },

    // Get all appointments for a specific patient
    getPatientAppointments: function(patientId) {
        return mockData.appointments.filter(apt => apt.patientId === parseInt(patientId));
    },

    // Get all appointments for a specific doctor
    getDoctorAppointments: function(doctorId) {
        return mockData.appointments.filter(apt => apt.doctorId === parseInt(doctorId));
    },

    // Get today's appointments for a doctor (useful for the doctor dashboard)
    getTodayAppointments: function(doctorId) {
        const today = new Date().toISOString().split('T')[0];
        return mockData.appointments.filter(apt =>
            apt.doctorId === parseInt(doctorId) && apt.date === today
        );
    },

    // Cancel an appointment and give the time slot back to the doctor
    // This way other patients can book that slot
    cancelAppointment: function(appointmentId) {
        const appointment = mockData.appointments.find(apt => apt.id === parseInt(appointmentId));
        if (appointment) {
            appointment.status = 'cancelled';
            appointment.cancelledAt = new Date().toISOString();

            // Important: return the time slot to the doctor's availability
            const doctor = this.getDoctorById(appointment.doctorId);
            if (doctor) {
                let dateSlot = doctor.availability.find(slot => slot.date === appointment.date);
                if (!dateSlot) {
                    // If that date doesn't exist in availability anymore, create it
                    dateSlot = { date: appointment.date, slots: [] };
                    doctor.availability.push(dateSlot);
                    doctor.availability.sort((a, b) => new Date(a.date) - new Date(b.date));
                }
                // Add the time back if it's not already there
                if (!dateSlot.slots.includes(appointment.time)) {
                    dateSlot.slots.push(appointment.time);
                    dateSlot.slots.sort(); // Keep times in order
                }
            }

            this.saveData();
            return true;
        }
        return false;
    },

    // Mark an appointment as completed (used by doctors)
    markAppointmentDone: function(appointmentId) {
        const appointment = mockData.appointments.find(apt => apt.id === parseInt(appointmentId));
        if (appointment) {
            appointment.status = 'done';
            this.saveData();
            return true;
        }
        return false;
    },

    // Book a new appointment - this is where the magic happens!
    // Includes lots of validation to prevent conflicts
    bookAppointment: function(appointmentData) {
        // First, check if this exact appointment already exists
        // We don't want duplicate bookings with the same doctor at the same time
        const duplicate = mockData.appointments.find(apt =>
            apt.patientId === appointmentData.patientId &&
            apt.doctorId === appointmentData.doctorId &&
            apt.date === appointmentData.date &&
            apt.time === appointmentData.time &&
            apt.status === 'booked'
        );

        if (duplicate) {
            return { error: 'You already have an appointment with this doctor at this time.' };
        }

        // Also check if the patient has ANY appointment at this time
        // You can't be in two places at once!
        const timeConflict = mockData.appointments.find(apt =>
            apt.patientId === appointmentData.patientId &&
            apt.date === appointmentData.date &&
            apt.time === appointmentData.time &&
            apt.status === 'booked'
        );

        if (timeConflict) {
            return { error: 'You already have another appointment at this time.' };
        }

        // Create a unique appointment ID using timestamp + random number
        // This gives us IDs like: 123456789 (last 6 digits of timestamp + random 3 digits)
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const appointmentId = parseInt(`${timestamp.toString().slice(-6)}${randomNum}`);

        // Build the appointment object with all the details
        const newAppointment = {
            id: appointmentId,
            ...appointmentData, // Spread operator to copy all properties
            status: 'booked',
            rating: null, // Patients can rate after the appointment
            bookedAt: new Date().toISOString() // Track when it was booked
        };
        mockData.appointments.push(newAppointment);

        // Remove this time slot from the doctor's availability
        // Once booked, nobody else can take it
        const doctor = this.getDoctorById(appointmentData.doctorId);
        if (doctor) {
            const dateSlot = doctor.availability.find(slot => slot.date === appointmentData.date);
            if (dateSlot) {
                const timeIndex = dateSlot.slots.indexOf(appointmentData.time);
                if (timeIndex !== -1) {
                    dateSlot.slots.splice(timeIndex, 1); // Remove the time
                    // If no more times available that day, remove the entire date
                    if (dateSlot.slots.length === 0) {
                        doctor.availability = doctor.availability.filter(slot => slot.date !== appointmentData.date);
                    }
                }
            }
        }

        this.saveData();
        return newAppointment;
    },

    // Let patients rate their experience after an appointment
    rateAppointment: function(appointmentId, rating) {
        const appointment = mockData.appointments.find(apt => apt.id === parseInt(appointmentId));
        if (appointment) {
            appointment.rating = rating;
            this.saveData();
            return true;
        }
        return false;
    },

    // Admin function: Add a new doctor to the system
    addDoctor: function(doctorData) {
        const newDoctor = {
            id: mockData.doctors.length + 1, // Auto-increment ID
            ...doctorData,
            rating: 0, // New doctors start with no rating
            availability: [] // Admin will add availability later
        };
        mockData.doctors.push(newDoctor);
        this.saveData();
        return newDoctor;
    },

    // Admin function: Update doctor information
    updateDoctor: function(doctorId, doctorData) {
        const doctor = mockData.doctors.find(doc => doc.id === parseInt(doctorId));
        if (doctor) {
            Object.assign(doctor, doctorData); // Merge new data into existing
            this.saveData();
            return true;
        }
        return false;
    },

    // Admin function: Remove a doctor from the system
    deleteDoctor: function(doctorId) {
        const index = mockData.doctors.findIndex(doc => doc.id === parseInt(doctorId));
        if (index !== -1) {
            mockData.doctors.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    },

    // Doctor function: Add available time slots to their schedule
    addTimeSlot: function(doctorId, date, time) {
        const doctor = this.getDoctorById(doctorId);
        if (doctor) {
            let dateSlot = doctor.availability.find(slot => slot.date === date);
            if (!dateSlot) {
                // If this date doesn't exist yet, create it
                dateSlot = { date, slots: [] };
                doctor.availability.push(dateSlot);
            }
            // Add the time if it's not already there
            if (!dateSlot.slots.includes(time)) {
                dateSlot.slots.push(time);
                dateSlot.slots.sort(); // Keep times organized
                this.saveData();
                return true;
            }
        }
        return false;
    },

    // Doctor function: Remove a time slot from their schedule
    removeTimeSlot: function(doctorId, date, time) {
        const doctor = this.getDoctorById(doctorId);
        if (doctor) {
            const dateSlot = doctor.availability.find(slot => slot.date === date);
            if (dateSlot) {
                const index = dateSlot.slots.indexOf(time);
                if (index !== -1) {
                    dateSlot.slots.splice(index, 1);
                    // Remove the entire date if no slots left
                    if (dateSlot.slots.length === 0) {
                        doctor.availability = doctor.availability.filter(slot => slot.date !== date);
                    }
                    this.saveData();
                    return true;
                }
            }
        }
        return false;
    },

    // Get system-wide statistics for the admin dashboard
    getStatistics: function() {
        const today = new Date().toISOString().split('T')[0];
        return {
            totalDoctors: mockData.doctors.length,
            totalPatients: mockData.patients.length,
            totalAppointments: mockData.appointments.length,
            todayAppointments: mockData.appointments.filter(apt => apt.date === today).length
        };
    },

    // Create a new patient account
    // Includes email validation to prevent duplicates
    registerPatient: function(patientData) {
        // Check if email already exists (case-insensitive)
        const exists = mockData.patients.find(p => p.email.toLowerCase() === patientData.email.toLowerCase());
        if (exists) {
            return { success: false, message: "Email already registered" };
        }

        const newPatient = {
            id: mockData.patients.length + 1,
            ...patientData
        };
        mockData.patients.push(newPatient);
        this.saveData();
        return { success: true, patient: newPatient };
    },

    // Update patient profile information
    updatePatient: function(patientId, patientData) {
        const patient = mockData.patients.find(p => p.id === parseInt(patientId));
        if (patient) {
            Object.assign(patient, patientData);
            this.saveData();
            return true;
        }
        return false;
    },

    // Show an alert message to the user (deprecated - we use toast now)
    showAlert: function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    },

    // Get app settings (theme, language, etc.)
    getSettings: function() {
        const settings = localStorage.getItem('appSettings');
        return settings ? JSON.parse(settings) : { theme: 'light', language: 'en' };
    },

    // Save and apply app settings
    saveSettings: function(settings) {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.applySettings(settings);
    },

    // Apply settings like dark mode
    applySettings: function(settings) {
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
};

// Show a nice toast notification (those little pop-ups that appear and disappear)
// Much better UX than alert() because they don't block the page
function showToast(message, type = 'info') {
    // Remove any existing toast first to avoid stacking
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create the toast element with appropriate styling
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    // Add to page and animate in
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove after 3 seconds with fade out animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show a confirmation dialog before important actions (like canceling appointments)
// Returns user's choice via callbacks
function showConfirmModal(message, onConfirm, onCancel) {
    // Clean up any existing modal
    const existingModal = document.querySelector('.confirm-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create the modal overlay and content
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'confirm-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-icon">⚠️</div>
            <div class="confirm-modal-message">${message}</div>
            <div class="confirm-modal-buttons">
                <button class="btn btn-outline confirm-cancel-btn">Cancel</button>
                <button class="btn btn-danger confirm-yes-btn">Remove</button>
            </div>
        </div>
    `;

    // Add to page and show with animation
    document.body.appendChild(modalOverlay);
    setTimeout(() => modalOverlay.classList.add('show'), 10);

    // Handle "Yes" button click
    modalOverlay.querySelector('.confirm-yes-btn').addEventListener('click', () => {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.remove();
            if (onConfirm) onConfirm();
        }, 300);
    });

    // Handle "Cancel" button click
    modalOverlay.querySelector('.confirm-cancel-btn').addEventListener('click', () => {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.remove();
            if (onCancel) onCancel();
        }, 300);
    });

    // Allow clicking outside the modal to cancel
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('show');
            setTimeout(() => {
                modalOverlay.remove();
                if (onCancel) onCancel();
            }, 300);
        }
    });
}

// When the page loads, initialize everything
// This runs automatically for every page in the app
document.addEventListener('DOMContentLoaded', function() {
    utils.loadData(); // Load saved data from localStorage
    const settings = utils.getSettings();
    utils.applySettings(settings); // Apply user's theme preferences
});

// Export for Node.js if needed (for testing or server-side rendering)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mockData, utils };
}
