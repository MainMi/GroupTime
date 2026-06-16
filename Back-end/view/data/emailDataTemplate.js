module.exports = {
    welcome: {
        renderType: 'emailTempalte.ejs',
        subject: 'Ласкаво просимо на сайт GroupTime',
        data: {
            title: 'Ласкаво просимо',
            // eslint-disable-next-line max-len
            subtitle: 'Тут ви зможете дивитися , змінювати , додавати розклад та дз , мати інструменти які допоможуть в начанні та багато іншого...'
        }
    },
    confirmEmail: {
        renderType: 'emailConfirmTemplate.ejs',
        subject: 'Підтвердіть вашу почту',
        data: {
            title: 'Пітвердження почти',
            // eslint-disable-next-line max-len
            subtitle: 'Щоб закінчити регістрацію необхідно пітвердити вашу почту , для цього перейдіть натисніть на кнопку або перейдіть за посиланням:',
            btnTexts: ['Пітвердити почту'],
            href: []
        }
    },
    forgetPassword: {
        renderType: 'emailConfirmTemplate.ejs',
        subject: 'Підтвердіть вашу почту',
        data: {
            title: 'Відновлення пароля',
            subtitle: 'Щоб закінчити змінити пароль натисніть на кнопку або перейдіть за посиланням:',
            btnTexts: ['Пітвердити почту'],
            href: []
        }
    },
    confirmAdmin: {
        renderType: 'emailConfirmTemplate.ejs',
        subject: 'Створення группи - з\'явився староста',
        data: {
            title: 'Перевірьте валідність данних Старости',
            subtitle: 'Щоб закінчити додати або видалити користувача натисніть на одну з кнопок посиланням:',
            btnTexts: [
                'Додати старосту',
                'Видалити старосту'
            ],
            hrefs: [],
            userInfo: {}
        }
    },
    confirmUser: {
        renderType: 'emailConfirmTemplate.ejs',
        subject: 'Нова заявка на приєднання до групи',
        data: {
            title: 'Користувач хоче приєднатися до вашої групи',
            subtitle: 'Перевірте дані користувача та підтвердіть або відхиліть заявку, натиснувши на одну з кнопок:',
            btnTexts: [
                'Підтвердити користувача',
                'Відхилити користувача'
            ],
            hrefs: [],
            userInfo: {}
        }
    },
    userJoined: {
        renderType: 'emailConfirmTemplate.ejs',
        subject: 'Новий учасник приєднався до групи',
        data: {
            title: 'До вашої групи приєднався новий учасник',
            subtitle: 'Це інформаційне повідомлення. Нижче — дані нового учасника:',
            userInfo: {}
        }
    },
    inviteUser: {
        renderType: 'emailConfirmTemplate.ejs',
        subject: 'Вас запрошено до нової групи',
        data: {
            // Default title; the controller overrides it with the group name
            // ("Вас запрошує група «X»") via the email context.
            title: 'Вас запрошують приєднатися до групи',
            subtitle: 'Щоб приєднатися або відмовитися від запрошення, натисніть на одну з кнопок або перейдіть за посиланням:',
            btnTexts: [
                'Приєднатися до групи',
                'Відмовитися від запрошення'
            ],
            hrefs: [],
            // The invitee is shown details about the group (name + description),
            // not their own info — populated per-send by the controller.
            groupInfo: {}
        }
    },
};
