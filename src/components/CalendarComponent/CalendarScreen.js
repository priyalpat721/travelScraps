import React, {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {useDispatch, useSelector} from "react-redux";
import service from "./service";
import {useHistory} from "react-router-dom";
import './calendar.css'
import {TRAVELLER} from "../../constants/userConst";
import Input from "../Auth/Input";

const calendarState = (state) => state.calendar;
const eventsState = (state) => state.events;

let guideDate;

const CalendarScreen = () => {
    const [user, setUser] = useState({});
    const [eventList, setEventList] = useState([]);
    const [guideTitle, setGuideTitle] = useState("")
    const history = useHistory();
    const getProfile = async () => {
        fetch(`http://localhost:4000/api/profile`, {
            method: 'POST',
            credentials: 'include'
        }).then(res => res.json())
            .then(user => {
                setUser(user);
                // if (user._id !== null) {
                //     service.findCountCalendarByPersonId(dispatch, user._id)
                // }
            }).catch(() => history.push('/login'));
    }

    useEffect(getProfile, [history]);


    const calendarObject = useSelector(calendarState);
    const eventArray = useSelector(eventsState);
    const dispatch = useDispatch();
    // const eventFetchFunction = calendarObject.events.map(id => service.getEventById(dispatch, id));
    let eventNum = calendarObject.events.length;

    // const eventArray = useSelector(eventsState);
    // const eventArray = calendarObject.events
    useEffect(() =>  service.findCountCalendarByPersonId(dispatch, user._id), [user]);


    // const eventFetchFunction = calendarObject.events.map(id => service.getEventById(dispatch, id));



    const populateData = async () => {
        for (let i = 0; i < calendarObject.events.length; i++) {
            let id = calendarObject.events[i];
            await service.getEventById(dispatch, id);
        }
        console.log("Calling backend");
    }

    useEffect(() => populateData(), [eventNum]);

    const handleTravelerDateClick = (dateClickInfo) => {
        const formatedDate = dateClickInfo.dateStr
        let title = prompt("Please enter title of your new plan:", "Home");
        if (title !== null && title !== "") {
            const newEvent = {title: title, date: formatedDate }
            addEventToUserCalendar(dispatch, newEvent)
        }
    }

    const addEventToUserCalendar = async(dispatch, newEvent) => {
        await service.createEvent(dispatch, newEvent)
            .then( (eventId) => {
                const newCalendar = {...calendarObject, events: [...calendarObject.events, eventId]}
                service.updateCalendar(dispatch, calendarObject._id, newCalendar)
            }).then(() =>
                service.findCountCalendarByPersonId(dispatch, calendarObject.person)
            ).then(() => eventNum += 1);
    }

    const handleGuideDateClick = (dateClickInfo) => {
        guideDate = dateClickInfo.dateStr
        openModal()

    }

    const handleSendEvent = async () => {
        const selected = [];
        for (let option of document.getElementById("person-list").options)
        {
            if (option.selected) {
                selected.push(option.value);
            }
        }
        console.log("selected personId", selected)
        const newEvent = {title: guideTitle, date: guideDate }
        alert(`newEvent ${JSON.stringify(newEvent)}`)
        await addEventToUserCalendar(dispatch, newEvent)

        if (guideTitle !== null && guideTitle !== "" && guideDate !== null) {
            for (let personId of selected) {
                console.log("befoer network call", personId)
                await service.sendEventToTraveler(personId, newEvent)
            }
        }
    }




    const handleEventClick = (info) => {
        if (window.confirm("Delete this event?")) {
            const deletedEvent = eventArray.find((event) => event.title === info.event.title)
            const newCalendar = {
                ...calendarObject,
                events: calendarObject.events.filter((eventId) => eventId !== deletedEvent._id)
            }
            service.deleteEvent(dispatch, deletedEvent._id, newCalendar, calendarObject._id)
            if (window.confirm("Delete is successful")) {
                eventNum -= 1
            } else {
                eventNum -= 1
            }
        }
    }

    // Get the modal
    const modal = document.getElementById("guideModal");

    // Get the button that opens the modal
    const btn = document.getElementById("mybtn");

    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal
    const openModal = () => modal.style.display = "block";


    // When the user clicks on <span> (x), close the modal
    const closeModal = () => modal.style.display = "none";

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }

    const [travelers, setTravelers] = useState([]);
    useEffect(() => service.findByType(TRAVELLER, setTravelers), [history])

    const [eventTravelers, setEventTravelers] = useState([])


    // Get the button that opens the modal
    const personList = document.getElementById("person-list");
    // locate your element and add the Click Event Listener
    const handleClickPerson = (e) => {
        if (e.target && e.target.nodeName === "LI") {
            setEventTravelers([...eventTravelers, e.target.id])
        }
    }



    return (
        <>
            <div id="guideModal" className="modal" tabIndex="-1" role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add Event</h5>
                            <button onClick={closeModal} type="button" className="close bg-white border-0" data-dismiss="modal" aria-label="Close">
                                <span class="close">&times;</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <h5 className="text-primary">Event title</h5> <br/>
                            <Input name="travel-title" handleChange={(e) => setGuideTitle(e.target.value)}/>
                            <br/>
                            <h5 className="text-primary">Send Event notice to..</h5><br/>
                            <select id="person-list" className="form-select" multiple aria-label="multiple select example">
                                {travelers.map((person) => <option value={person._id}>{person.userName}</option>)}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={handleSendEvent}>Send Event</button>
                            <button type="button" onClick={closeModal} className="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={openModal} id="myBtn">Open Modal</button>


        <div className="mainContainer">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                dateClick={handleGuideDateClick}
                eventClick={handleEventClick}
                initialView="dayGridMonth"
                events={ {events: eventArray,   eventColor: '#378006'}}
            />
        </div>
        </>
    );
}
export default CalendarScreen;