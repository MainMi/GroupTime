const { faker } = require('@faker-js/faker');
const {
    userRoleEnum,
    groupTypesEnum
} = require('../../constant');
const { ADMIN_ROLE } = require('../../constant/user.role.enum');
const { getFormattedDateWithTime } = require('./getFormattedDate');

const getRandomEnum = (enumObject) => {
    const values = Object.values(enumObject);
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
};

const generateEventInfoData = () => {
    const eventInfoData = {
        name: faker.lorem.word({ length: { min: 2, max: 20 } }),
        teacherName: faker.lorem.word({ length: { min: 2, max: 50 } }),
        type: faker.lorem.word({ length: { min: 2, max: 20 } }),
        place: faker.location.streetAddress(),
        platform: faker.lorem.word({ length: { min: 2, max: 20 } }),
        link: faker.internet.url(),
        tag: faker.lorem.word({ length: { min: 2, max: 20 } })
    };

    return eventInfoData;
};

module.exports = {
    createUser: (setData = {}) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fakeUser = {
            nickname: faker.internet.userName({
                firstName,
                lastName
            }),
            firstName,
            lastName,
            email: faker.internet.email({
                firstName,
                lastName
            }).toLowerCase(),
            password: faker.internet.password({
                length: faker.number.int({
                    min: 8,
                    max: 30
                }),
                pattern: /[A-Za-z0-9\d@$!%*#?&]$/,
                prefix: '@e2'
            }),
            birthday: faker.date.birthdate({
                min: 18,
                max: 65,
                mode: 'age'
            }),
            global_role: userRoleEnum.USER_ROLE,
            groups: [],
            avatar: null,
            authorized: false
        };
        return { ...fakeUser, ...setData };
    },
    generatePassword: () => faker.internet.password({
        length: faker.number.int({
            min: 8,
            max: 30
        }),
        pattern: /[A-Za-z0-9\d@$!%*#?&]$/,
        prefix: '@e2'
    }),
    createGroup: (setData) => {
        const fakeGroup = {
            description: faker.lorem.lines(),
            name: faker.lorem.word({
                length: faker.number.int({
                    min: 5,
                    max: 10
                })
            }),
            schedule: {},
            users: [],
            type: faker.helpers.arrayElement(
                [...Object.values(groupTypesEnum)]
            ),
            parameters: {
                usersLimit: faker.number.int({
                    min: 5,
                    max: 50
                }),
                createEventInfosRole: ADMIN_ROLE,
                notifacionFromEmail: faker.datatype.boolean()
            }
        };

        return { ...fakeGroup, ...setData };
    },

    getRandomEnum,

    generateEventInfoData,

    createPair: () => {
        const fakePair = generateEventInfoData();
        fakePair.date = getFormattedDateWithTime(new Date());
        fakePair.duration = faker.number.int({ min: 5, max: 300 });

        return fakePair;
    },
};
