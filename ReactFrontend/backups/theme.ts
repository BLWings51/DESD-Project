import { Input, createTheme } from '@mantine/core';
import classes from './cssModules/textInput.module.css';

export const theme = createTheme({
    white: "#eeeee4",
    autoContrast: true,
    colors: {
        primary: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#303030', '#212121', '#000000'],
        secondary: ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#D6D6D6', '#CCCCCC', '#BDBDBD', '#B0B0B0', '#A3A3A3'],
        tertiary: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],

    },

    shadows: {
        md: '1px 1px 3px rgba(0, 0, 0, .25)',
        xl: '5px 5px 3px rgba(0, 0, 0, .25)',
    },

    headings: {
        fontFamily: 'Roboto, sans-serif',
        sizes: {
            h1: { fontSize: "36" },
        },
    },

    components: {
        Input: Input.extend({ classNames: classes }),
    }

});
