module.exports = {
    parseDate(value) {
        const [
            day,
            month,
            year
        ] = value.split('.');

        const formattedDate = `${year}-${month}-${day}`;

        const date = new Date(formattedDate);

        if (Number.isNaN(date.getTime())) {
            return { value, errors: ['Invalid date format'] };
        }

        return { value: date };
    }
};
