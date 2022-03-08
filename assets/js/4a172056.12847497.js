"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[3235],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return m}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var s=a.createContext({}),p=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},c=function(e){var t=p(e.components);return a.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,s=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),d=p(n),m=r,h=d["".concat(s,".").concat(m)]||d[m]||u[m]||i;return n?a.createElement(h,l(l({ref:t},c),{},{components:n})):a.createElement(h,l({ref:t},c))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,l=new Array(i);l[0]=d;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o.mdxType="string"==typeof e?e:r,l[1]=o;for(var p=2;p<i;p++)l[p]=n[p];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},9443:function(e,t,n){var a=(0,n(7294).createContext)(void 0);t.Z=a},3626:function(e,t,n){n.r(t),n.d(t,{contentTitle:function(){return y},default:function(){return g},frontMatter:function(){return h},metadata:function(){return v},toc:function(){return f}});var a=n(2122),r=n(9756),i=n(7294),l=n(3905),o=n(9443);var s=function(){var e=(0,i.useContext)(o.Z);if(null==e)throw new Error('"useUserPreferencesContext" is used outside of "Layout" component.');return e},p=n(6010),c="tabItem_1uMI",u="tabItemActive_2DSg";var d=function(e){var t,n=e.lazy,a=e.block,r=e.defaultValue,l=e.values,o=e.groupId,d=e.className,m=i.Children.toArray(e.children),h=null!=l?l:m.map((function(e){return{value:e.props.value,label:e.props.label}})),y=null!=r?r:null==(t=m.find((function(e){return e.props.default})))?void 0:t.props.value,v=s(),f=v.tabGroupChoices,k=v.setTabGroupChoices,g=(0,i.useState)(y),w=g[0],N=g[1],b=[];if(null!=o){var T=f[o];null!=T&&T!==w&&h.some((function(e){return e.value===T}))&&N(T)}var x=function(e){var t=e.currentTarget,n=b.indexOf(t),a=h[n].value;N(a),null!=o&&(k(o,a),setTimeout((function(){var e,n,a,r,i,l,o,s;(e=t.getBoundingClientRect(),n=e.top,a=e.left,r=e.bottom,i=e.right,l=window,o=l.innerHeight,s=l.innerWidth,n>=0&&i<=s&&r<=o&&a>=0)||(t.scrollIntoView({block:"center",behavior:"smooth"}),t.classList.add(u),setTimeout((function(){return t.classList.remove(u)}),2e3))}),150))},j=function(e){var t,n=null;switch(e.key){case"ArrowRight":var a=b.indexOf(e.target)+1;n=b[a]||b[0];break;case"ArrowLeft":var r=b.indexOf(e.target)-1;n=b[r]||b[b.length-1]}null==(t=n)||t.focus()};return i.createElement("div",{className:"tabs-container"},i.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,p.Z)("tabs",{"tabs--block":a},d)},h.map((function(e){var t=e.value,n=e.label;return i.createElement("li",{role:"tab",tabIndex:w===t?0:-1,"aria-selected":w===t,className:(0,p.Z)("tabs__item",c,{"tabs__item--active":w===t}),key:t,ref:function(e){return b.push(e)},onKeyDown:j,onFocus:x,onClick:x},null!=n?n:t)}))),n?(0,i.cloneElement)(m.filter((function(e){return e.props.value===w}))[0],{className:"margin-vert--md"}):i.createElement("div",{className:"margin-vert--md"},m.map((function(e,t){return(0,i.cloneElement)(e,{key:t,hidden:e.props.value!==w})}))))};var m=function(e){var t=e.children,n=e.hidden,a=e.className;return i.createElement("div",{role:"tabpanel",hidden:n,className:a},t)},h={id:"try",title:"Try MapillaryJS"},y=void 0,v={unversionedId:"intro/try",id:"intro/try",isDocsHomePage:!1,title:"Try MapillaryJS",description:"MapillaryJS is essentially an npm package that can be installed via Yarn or npm. In this guide we will go through what you need to do to start using MapillaryJS in your web application.",source:"@site/docs/intro/try.mdx",sourceDirName:"intro",slug:"/intro/try",permalink:"/mapillary-js/docs/intro/try",editUrl:"https://github.com/mapillary/mapillary-js/edit/main/doc/docs/intro/try.mdx",tags:[],version:"current",frontMatter:{id:"try",title:"Try MapillaryJS"},sidebar:"docs",previous:{title:"Introduction",permalink:"/mapillary-js/docs/"},next:{title:"Glossary",permalink:"/mapillary-js/docs/intro/glossary"}},f=[{value:"Prerequisites",id:"prerequisites",children:[{value:"Client Access Token",id:"client-access-token",children:[]},{value:"Tools",id:"tools",children:[]}]},{value:"Add MapillaryJS to a Website",id:"add-mapillaryjs-to-a-website",children:[{value:"Using an ES6 Module Bundler",id:"using-an-es6-module-bundler",children:[]},{value:"Using a CDN",id:"using-a-cdn",children:[]}]},{value:"That&#39;s It!",id:"thats-it",children:[]},{value:"Recap",id:"recap",children:[]},{value:"Next steps",id:"next-steps",children:[]}],k={toc:f};function g(e){var t=e.components,n=(0,r.Z)(e,["components"]);return(0,l.kt)("wrapper",(0,a.Z)({},k,n,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("p",null,"MapillaryJS is essentially an ",(0,l.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/mapillary-js"},"npm package")," that can be installed via ",(0,l.kt)("a",{parentName:"p",href:"https://classic.yarnpkg.com"},"Yarn")," or ",(0,l.kt)("a",{parentName:"p",href:"https://docs.npmjs.com/about-npm"},"npm"),". In this guide we will go through what you need to do to start using MapillaryJS in your web application."),(0,l.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,l.kt)("div",{parentName:"div",className:"admonition-heading"},(0,l.kt)("h5",{parentName:"div"},(0,l.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,l.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,l.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"You will learn")),(0,l.kt)("div",{parentName:"div",className:"admonition-content"},(0,l.kt)("ul",{parentName:"div"},(0,l.kt)("li",{parentName:"ul"},"How to install MapillaryJS"),(0,l.kt)("li",{parentName:"ul"},"How to add MapillaryJS to your website")))),(0,l.kt)("h2",{id:"prerequisites"},"Prerequisites"),(0,l.kt)("h3",{id:"client-access-token"},"Client Access Token"),(0,l.kt)("p",null,"To start using MapillaryJS with data from the ",(0,l.kt)("a",{parentName:"p",href:"https://www.mapillary.com"},"Mapillary")," platform, you need to:"),(0,l.kt)("ol",null,(0,l.kt)("li",{parentName:"ol"},"Create a ",(0,l.kt)("a",{parentName:"li",href:"https://www.mapillary.com/app/?login=true"},"Mapillary account")),(0,l.kt)("li",{parentName:"ol"},(0,l.kt)("a",{parentName:"li",href:"https://www.mapillary.com/app/?login=true"},"Sign in")," to your account"),(0,l.kt)("li",{parentName:"ol"},(0,l.kt)("a",{parentName:"li",href:"https://www.mapillary.com/dashboard/developers"},"Register an application")," in the developer dashboard"),(0,l.kt)("li",{parentName:"ol"},"Get the ",(0,l.kt)("a",{parentName:"li",href:"https://mapillary.com/developer/api-documentation"},"client access token")," for your new application")),(0,l.kt)("p",null,"Keep the ",(0,l.kt)("em",{parentName:"p"},"client access token")," for your application at hand, you will use it when initializing the MapillaryJS viewer later."),(0,l.kt)("p",null,"When ",(0,l.kt)("a",{parentName:"p",href:"/docs/extension/extend"},"extending MapillaryJS")," to provide your own data, no account or access token is needed."),(0,l.kt)("h3",{id:"tools"},"Tools"),(0,l.kt)("p",null,"To install MapillaryJS you need to have ",(0,l.kt)("a",{parentName:"p",href:"https://classic.yarnpkg.com"},"Yarn")," or ",(0,l.kt)("a",{parentName:"p",href:"https://docs.npmjs.com/cli/v7/configuring-npm/install"},"Node.js and npm")," installed."),(0,l.kt)("p",null,"Once you have setup the prerequisites, you can try MapillaryJS in your own website."),(0,l.kt)("h2",{id:"add-mapillaryjs-to-a-website"},"Add MapillaryJS to a Website"),(0,l.kt)("h3",{id:"using-an-es6-module-bundler"},"Using an ES6 Module Bundler"),(0,l.kt)("p",null,"Install the package."),(0,l.kt)(d,{defaultValue:"yarn",values:[{label:"Yarn",value:"yarn"},{label:"npm",value:"npm"}],mdxType:"Tabs"},(0,l.kt)(m,{value:"yarn",mdxType:"TabItem"},(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-zsh"},"yarn add mapillary-js\n"))),(0,l.kt)(m,{value:"npm",mdxType:"TabItem"},(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-zsh"},"npm install --save mapillary-js\n")))),(0,l.kt)("p",null,"Use a CSS loader or include the CSS file in the ",(0,l.kt)("inlineCode",{parentName:"p"},"<head>")," of your HTML file."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-html"},'<link\n  href="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.css"\n  rel="stylesheet"\n/>\n')),(0,l.kt)("p",null,"Include the following code in your application. You need to replace ",(0,l.kt)("inlineCode",{parentName:"p"},"<your access token>")," with the ",(0,l.kt)("em",{parentName:"p"},"client access token")," for the application you registered before. You also need a valid image ID to initialize the viewer."),(0,l.kt)("p",null,"If you are developing a TypeScript application you will get code editor intellisense while typing."),(0,l.kt)(d,{defaultValue:"ts",values:[{label:"TypeScript",value:"ts"},{label:"JavaScript",value:"js"}],mdxType:"Tabs"},(0,l.kt)(m,{value:"ts",mdxType:"TabItem"},(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"import {Viewer, ViewerOptions} from 'mapillary-js';\n\nconst container = document.createElement('div');\ncontainer.style.width = '400px';\ncontainer.style.height = '300px';\ndocument.body.appendChild(container);\n\nconst options: ViewerOptions = {\n  accessToken: '<your access token>',\n  container,\n  imageId: '<your image ID for initializing the viewer>',\n};\nconst viewer = new Viewer(options);\n"))),(0,l.kt)(m,{value:"js",mdxType:"TabItem"},(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"import {Viewer} from 'mapillary-js';\n\nconst container = document.createElement('div');\ncontainer.style.width = '400px';\ncontainer.style.height = '300px';\ndocument.body.appendChild(container);\n\nconst viewer = new Viewer({\n  accessToken: '<your access token>',\n  container,\n  imageId: '<your image ID for initializing the viewer>',\n});\n")))),(0,l.kt)("h3",{id:"using-a-cdn"},"Using a CDN"),(0,l.kt)("p",null,"Include the JavaScript and CSS files in the ",(0,l.kt)("inlineCode",{parentName:"p"},"<head>")," of your HTML file."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-html"},'<script src="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.js"><\/script>\n<link\n  href="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.css"\n  rel="stylesheet"\n/>\n')),(0,l.kt)("p",null,"Add a container to the ",(0,l.kt)("inlineCode",{parentName:"p"},"<body>")," of your HTML file."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-html"},'<div id="mly" style="width: 400px; height: 300px;"></div>\n')),(0,l.kt)("p",null,"The global ",(0,l.kt)("a",{parentName:"p",href:"https://github.com/umdjs/umd"},"UMD")," name for MapillaryJS is ",(0,l.kt)("inlineCode",{parentName:"p"},"mapillary"),". Include the following script in the ",(0,l.kt)("inlineCode",{parentName:"p"},"<body>")," of your HTML file."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-html"},"<script>\n  var {Viewer} = mapillary;\n\n  var viewer = new Viewer({\n    accessToken: '<your access token>',\n    container: 'mly', // the ID of our container defined in the HTML body\n    imageId: '<your image ID for initializing the viewer>',\n  });\n<\/script>\n")),(0,l.kt)("h2",{id:"thats-it"},"That's It!"),(0,l.kt)("p",null,"Congratulations! You have just added MapillaryJS to your project."),(0,l.kt)("p",null,"You should see something similar to what is shown in the live editor below."),(0,l.kt)("div",{className:"admonition admonition-note alert alert--secondary"},(0,l.kt)("div",{parentName:"div",className:"admonition-heading"},(0,l.kt)("h5",{parentName:"div"},(0,l.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,l.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,l.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"}))),"note")),(0,l.kt)("div",{parentName:"div",className:"admonition-content"},(0,l.kt)("p",{parentName:"div"},"Throughout the documentation the live example editors use the ",(0,l.kt)("a",{parentName:"p",href:"https://reactjs.org/"},"React library")," and the ",(0,l.kt)("a",{parentName:"p",href:"https://reactjs.org/docs/introducing-jsx.html"},"JSX syntax"),". This is the first such example that you will see. If you have not used React before, that is no problem, understanding React and JSX is not needed to follow along in the guides."))),(0,l.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,l.kt)("div",{parentName:"div",className:"admonition-heading"},(0,l.kt)("h5",{parentName:"div"},(0,l.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,l.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,l.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,l.kt)("div",{parentName:"div",className:"admonition-content"},(0,l.kt)("p",{parentName:"div"},"You can edit the code and get immediate feedback in the ",(0,l.kt)("strong",{parentName:"p"},"Result")," section."))),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function renderMapillary(props) {\n  class ViewerComponent extends React.Component {\n    constructor(props) {\n      super(props);\n      this.containerRef = React.createRef();\n    }\n\n    componentDidMount() {\n      this.viewer = new Viewer({\n        accessToken: this.props.accessToken,\n        container: this.containerRef.current,\n        imageId: this.props.imageId,\n      });\n    }\n\n    componentWillUnmount() {\n      if (this.viewer) {\n        this.viewer.remove();\n      }\n    }\n\n    render() {\n      return <div ref={this.containerRef} style={this.props.style} />;\n    }\n  }\n\n  return (\n    <ViewerComponent\n      accessToken={accessToken}\n      imageId={'498763468214164'}\n      style={{width: '100%', height: '300px'}}\n    />\n  );\n}\n")),(0,l.kt)("h2",{id:"recap"},"Recap"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},"Install MapillaryJS with Yarn or npm, or use a CDN"),(0,l.kt)("li",{parentName:"ul"},"Use a CSS loader or include the CSS file in the ",(0,l.kt)("inlineCode",{parentName:"li"},"<head>")," of your HTML file"),(0,l.kt)("li",{parentName:"ul"},"Import the Viewer class and create a new Viewer instance with your options")),(0,l.kt)("h2",{id:"next-steps"},"Next steps"),(0,l.kt)("p",null,"Now you are ready to start exploring the ",(0,l.kt)("a",{parentName:"p",href:"/docs/main/guide"},"guide to main concepts"),"."))}g.isMDXComponent=!0},6010:function(e,t,n){function a(e){var t,n,r="";if("string"==typeof e||"number"==typeof e)r+=e;else if("object"==typeof e)if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(n=a(e[t]))&&(r&&(r+=" "),r+=n);else for(t in e)e[t]&&(r&&(r+=" "),r+=t);return r}function r(){for(var e,t,n=0,r="";n<arguments.length;)(e=arguments[n++])&&(t=a(e))&&(r&&(r+=" "),r+=t);return r}n.d(t,{Z:function(){return r}})}}]);