import { mount } from 'svelte';
import App from './App.svelte';
import 'react-loading-regions/styles.css';
mount(App, { target: document.getElementById('app')! });
