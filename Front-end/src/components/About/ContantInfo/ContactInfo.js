import classes from './ContactInfo.module.scss'

import ContactInfoText from '../../../static/text/ContactInfoText'

const ContactInfo = (props) => {
    const { teamName , isContacts = false, color='green' } = props;
    const teamInfo = ContactInfoText[teamName];
    return <div className={classes.contactBox}>
        <img className={classes.avatar} src={teamInfo.avatar} alt={`Avatar ${teamName}`}></img>
        <h3>{teamInfo.fullname}</h3>
        {isContacts && <div className={classes.contact}>
            {teamInfo.contacts.map((user, index) => {
                return <label for={`${user.type}`}>
                    <img src={`../../../static/image/constactsInfo/${user.type}-${color}.svg`} alt={`${user.type}`}></img>
                    <p>{user.value}</p>
                </label>
            })}        
        </div>}
    </div>
}

export default ContactInfo