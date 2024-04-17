"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[8552],{3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return v}});var a=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=a.createContext({}),l=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},p=function(e){var t=l(e.components);return a.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,s=e.parentName,p=c(e,["components","mdxType","originalType","parentName"]),m=l(n),v=i,h=m["".concat(s,".").concat(v)]||m[v]||d[v]||r;return n?a.createElement(h,o(o({ref:t},p),{},{components:n})):a.createElement(h,o({ref:t},p))}));function v(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,o=new Array(r);o[0]=m;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:i,o[1]=c;for(var l=2;l<r;l++)o[l]=n[l];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5014:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return o},contentTitle:function(){return c},metadata:function(){return s},toc:function(){return l},default:function(){return d}});var a=n(2122),i=n(9756),r=(n(7294),n(3905)),o={id:"control",title:"Controlling the Viewer"},c=void 0,s={unversionedId:"main/control",id:"main/control",isDocsHomePage:!1,title:"Controlling the Viewer",description:"In the initialization guide we configured the Viewer with options at creation time. In this guide we will control the viewer's behavior and appearance after initialization through the Viewer's API methods.",source:"@site/docs/main/control.md",sourceDirName:"main",slug:"/main/control",permalink:"/mapillary-js/docs/main/control",editUrl:"https://github.com/mapillary/mapillary-js/edit/main/doc/docs/main/control.md",tags:[],version:"current",frontMatter:{id:"control",title:"Controlling the Viewer"},sidebar:"docs",previous:{title:"Initialization",permalink:"/mapillary-js/docs/main/init"},next:{title:"Event Handling",permalink:"/mapillary-js/docs/main/event"}},l=[{value:"Using the Cover",id:"using-the-cover",children:[]},{value:"Behavior and Appearance",id:"behavior-and-appearance",children:[]},{value:"Filtering",id:"filtering",children:[]},{value:"Recap",id:"recap",children:[]}],p={toc:l};function d(e){var t=e.components,n=(0,i.Z)(e,["components"]);return(0,r.kt)("wrapper",(0,a.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"In the ",(0,r.kt)("a",{parentName:"p",href:"/docs/main/init"},"initialization guide")," we configured the ",(0,r.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer"},"Viewer")," with options at creation time. In this guide we will control the viewer's behavior and appearance after initialization through the ",(0,r.kt)("inlineCode",{parentName:"p"},"Viewer"),"'s API methods."),(0,r.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"You will learn")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("ul",{parentName:"div"},(0,r.kt)("li",{parentName:"ul"},"How to activate and deactivate the ",(0,r.kt)("em",{parentName:"li"},"cover")," component"),(0,r.kt)("li",{parentName:"ul"},"How to configure the ",(0,r.kt)("inlineCode",{parentName:"li"},"Viewer")," after initialization"),(0,r.kt)("li",{parentName:"ul"},"How to filter the street imagery map")))),(0,r.kt)("h2",{id:"using-the-cover"},"Using the Cover"),(0,r.kt)("p",null,"The MapillaryJS ",(0,r.kt)("em",{parentName:"p"},"cover")," is a special component that can be activated and deactivated at any time. When the cover is active, MapillaryJS, does not perform any operations at all. After initialization we use the Viewer.",(0,r.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer#activatecover"},"activateCover")," and Viewer.",(0,r.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer#deactivatecover"},"deactivateCover")," methods to show or hide the ",(0,r.kt)("em",{parentName:"p"},"cover"),"."),(0,r.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"Try tapping the ",(0,r.kt)("em",{parentName:"p"},"cover")," activation checkbox to see how it affects the ",(0,r.kt)("inlineCode",{parentName:"p"},"Viewer"),"."))),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function render(props) {\n  let viewer;\n  function dispose() {\n    if (viewer) {\n      viewer.remove();\n    }\n  }\n\n  const style = {height: '400px'};\n  const imageId = '205776974704285';\n\n  // Create cover checkbox\n  const checkbox = document.createElement('input');\n  checkbox.setAttribute('type', 'checkbox');\n  checkbox.style.pointerEvents = 'none';\n  const space = document.createElement('div');\n  space.classList.add('button-space');\n  space.appendChild(checkbox);\n  const toolbar = document.createElement('div');\n  toolbar.classList.add('example-editor-toolbar');\n  toolbar.style.zIndex = 100;\n  toolbar.style.top = '16px';\n  toolbar.style.left = '16px';\n  toolbar.appendChild(space);\n\n  // Listen to cover checkbox clicks\n  space.addEventListener('click', () => {\n    checkbox.dispatchEvent(new MouseEvent('click', {bubbles: false}));\n  });\n  checkbox.addEventListener('change', (event) => {\n    if (event.target.checked) {\n      viewer.activateCover();\n    } else {\n      viewer.deactivateCover();\n    }\n  });\n\n  function init(opts) {\n    const {accessToken, container} = opts;\n    const options = {accessToken, container};\n    viewer = new Viewer(options);\n    viewer.moveTo(imageId).catch(mapillaryErrorHandler);\n    container.appendChild(toolbar);\n  }\n\n  return (\n    <div>\n      <ViewerComponent init={init} dispose={dispose} style={style} />\n    </div>\n  );\n}\n")),(0,r.kt)("div",{className:"admonition admonition-note alert alert--secondary"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"}))),"note")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"In the live example we do not sync the checkbox when tapping the MapillaryJS cover image. Calling Viewer.",(0,r.kt)("inlineCode",{parentName:"p"},"deactivateCover")," when the cover is already deactivated has no effect."))),(0,r.kt)("h2",{id:"behavior-and-appearance"},"Behavior and Appearance"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function render(props) {\n  let viewer;\n  function dispose() {\n    if (viewer) {\n      viewer.remove();\n    }\n  }\n\n  const style = {height: '400px'};\n  const imageId = '821390568809272';\n\n  function init(opts) {\n    const {accessToken, container} = opts;\n    const options = {accessToken, container};\n    viewer = new Viewer(options);\n    viewer.moveTo(imageId).catch(mapillaryErrorHandler);\n\n    viewer.setTransitionMode(TransitionMode.Instantaneous);\n    viewer.setRenderMode(RenderMode.Letterbox);\n  }\n\n  return (\n    <div>\n      <ViewerComponent init={init} dispose={dispose} style={style} />\n    </div>\n  );\n}\n")),(0,r.kt)("h2",{id:"filtering"},"Filtering"),(0,r.kt)("p",null,"Filters are used for specifying which images are part of the MapillaryJS navigation. We can specify filters to ensure that for example ",(0,r.kt)("inlineCode",{parentName:"p"},"spherical")," images, images captured after a certain date, or images belonging to a specific sequence are the only ones shown. The filter is set through the Viewer.",(0,r.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer#setfilter"},"setFilter")," method and is applied globally. The filter can be cleared by setting it to an empty array."),(0,r.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"Try filtering on another ",(0,r.kt)("a",{parentName:"p",href:"/api/interfaces/api.SpatialImageEnt#camera_type"},"camera type")," or ",(0,r.kt)("a",{parentName:"p",href:"/api/modules/viewer#filterkey"},"key"),", and using another ",(0,r.kt)("a",{parentName:"p",href:"/api/modules/viewer#comparisonfilteroperator"},"comparison operator"),"."))),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function render(props) {\n  let viewer;\n  function dispose() {\n    if (viewer) {\n      viewer.remove();\n    }\n  }\n\n  const style = {height: '400px'};\n  const imageId = '821390568809272';\n\n  function init(opts) {\n    const {accessToken, container} = opts;\n    const options = {accessToken, container};\n    viewer = new Viewer(options);\n    viewer.moveTo(imageId).catch(mapillaryErrorHandler);\n\n    viewer.setFilter(['==', 'cameraType', 'fisheye']);\n  }\n\n  return (\n    <div>\n      <ViewerComponent init={init} dispose={dispose} style={style} />\n    </div>\n  );\n}\n")),(0,r.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"You can view more thorough code using the ",(0,r.kt)("inlineCode",{parentName:"p"},"Viewer")," APIs in the ",(0,r.kt)("a",{parentName:"p",href:"/examples/viewer-methods"},"Methods")," and ",(0,r.kt)("a",{parentName:"p",href:"/examples/viewer-filters"},"Filtering")," examples. You can also see how to control the ",(0,r.kt)("inlineCode",{parentName:"p"},"Viewer"),"'s point and field of view in the ",(0,r.kt)("a",{parentName:"p",href:"/examples/viewer-coordinates"},"Viewpoint")," example."))),(0,r.kt)("h2",{id:"recap"},"Recap"),(0,r.kt)("p",null,"Now you know how to use the ",(0,r.kt)("inlineCode",{parentName:"p"},"Viewer"),"'s APIs to:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Activate or deactivate the cover component"),(0,r.kt)("li",{parentName:"ul"},"Change the behavior of MapillaryJS"),(0,r.kt)("li",{parentName:"ul"},"Filter the images that are shown and are part of the navigation")))}d.isMDXComponent=!0}}]);