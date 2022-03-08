"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[7028],{3905:function(e,n,t){t.d(n,{Zo:function(){return l},kt:function(){return v}});var i=t(7294);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);n&&(i=i.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,i)}return t}function r(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,i,a=function(e,n){if(null==e)return{};var t,i,a={},o=Object.keys(e);for(i=0;i<o.length;i++)t=o[i],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(i=0;i<o.length;i++)t=o[i],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var p=i.createContext({}),c=function(e){var n=i.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):r(r({},n),e)),t},l=function(e){var n=c(e.components);return i.createElement(p.Provider,{value:n},e.children)},m={inlineCode:"code",wrapper:function(e){var n=e.children;return i.createElement(i.Fragment,{},n)}},d=i.forwardRef((function(e,n){var t=e.components,a=e.mdxType,o=e.originalType,p=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),d=c(t),v=a,h=d["".concat(p,".").concat(v)]||d[v]||m[v]||o;return t?i.createElement(h,r(r({ref:n},l),{},{components:t})):i.createElement(h,r({ref:n},l))}));function v(e,n){var t=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var o=t.length,r=new Array(o);r[0]=d;var s={};for(var p in n)hasOwnProperty.call(n,p)&&(s[p]=n[p]);s.originalType=e,s.mdxType="string"==typeof e?e:a,r[1]=s;for(var c=2;c<o;c++)r[c]=t[c];return i.createElement.apply(null,r)}return i.createElement.apply(null,t)}d.displayName="MDXCreateElement"},8771:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return r},contentTitle:function(){return s},metadata:function(){return p},toc:function(){return c},default:function(){return m}});var i=t(2122),a=t(9756),o=(t(7294),t(3905)),r={id:"init",title:"Initialization"},s=void 0,p={unversionedId:"main/init",id:"main/init",isDocsHomePage:!1,title:"Initialization",description:"MapillaryJS comes with a core set of street imagery interaction and visualization features. The Viewer object represents the street imagery viewer on your web page. It exposes methods that you can use to programatically change the view, and fires events as users interact with it.",source:"@site/docs/main/init.md",sourceDirName:"main",slug:"/main/init",permalink:"/mapillary-js/docs/main/init",editUrl:"https://github.com/mapillary/mapillary-js/edit/main/doc/docs/main/init.md",tags:[],version:"current",frontMatter:{id:"init",title:"Initialization"},sidebar:"docs",previous:{title:"Guide",permalink:"/mapillary-js/docs/main/guide"},next:{title:"Controlling the Viewer",permalink:"/mapillary-js/docs/main/control"}},c=[{value:"Using the Cover",id:"using-the-cover",children:[]},{value:"Viewer Options",id:"viewer-options",children:[]},{value:"Component Options",id:"component-options",children:[]},{value:"Recap",id:"recap",children:[]}],l={toc:c};function m(e){var n=e.components,t=(0,a.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,i.Z)({},l,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"MapillaryJS comes with a core set of street imagery interaction and visualization features. The ",(0,o.kt)("inlineCode",{parentName:"p"},"Viewer")," object represents the street imagery viewer on your web page. It exposes methods that you can use to programatically change the view, and fires events as users interact with it."),(0,o.kt)("p",null,"You can customize the ",(0,o.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer"},"Viewer")," behavior in different ways. In this guide we will do this at initialization time."),(0,o.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"You will learn")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("ul",{parentName:"div"},(0,o.kt)("li",{parentName:"ul"},"How to activate and deactivate the ",(0,o.kt)("em",{parentName:"li"},"cover")),(0,o.kt)("li",{parentName:"ul"},"How to configure the ",(0,o.kt)("inlineCode",{parentName:"li"},"Viewer")," through options"),(0,o.kt)("li",{parentName:"ul"},"How to configure ",(0,o.kt)("em",{parentName:"li"},"components")," through options")))),(0,o.kt)("h2",{id:"using-the-cover"},"Using the Cover"),(0,o.kt)("p",null,"The MapillaryJS ",(0,o.kt)("em",{parentName:"p"},"cover")," is a special component that can be activated and deactivated at any time. When the cover is active, MapillaryJS, does not perform any operations at all. We can use the ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.componentoptions"},"component options")," to decide if the ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.componentoptions#cover"},"cover")," should be active or not when at initialization."),(0,o.kt)("p",null,"If we specify an image ID in the ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.vieweroptions#imageid"},"viewer options"),", the cover will always be visible initially (but can be hidden automatically through with the ",(0,o.kt)("inlineCode",{parentName:"p"},"cover: false")," component option)."),(0,o.kt)("p",null,"If we do not specify an image ID in the viewer options the cover will be hidden (resulting in a dark background being shown). In this case, we need another way to tell inform the Viewer about the initial image. We can use the Viewer.",(0,o.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer/#moveto"},"moveTo")," method to do that by calling it with our image ID."),(0,o.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},"Try changing the ",(0,o.kt)("em",{parentName:"p"},"cover")," option to ",(0,o.kt)("inlineCode",{parentName:"p"},"false")," to see how it affects ",(0,o.kt)("inlineCode",{parentName:"p"},"Viewer")," initialization."))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function render(props) {\n  let viewer;\n  let coverViewer;\n  function dispose() {\n    if (viewer) {\n      viewer.remove();\n    }\n  }\n  function disposeCover() {\n    if (coverViewer) {\n      coverViewer.remove();\n    }\n  }\n\n  const style = {height: '400px', width: '50%', display: 'inline-block'};\n  const imageId = '3748064795322267';\n\n  function init(opts) {\n    const {accessToken, container} = opts;\n    const options = {accessToken, container};\n    viewer = new Viewer(options);\n    viewer.moveTo(imageId).catch(mapillaryErrorHandler);\n  }\n\n  function initCover(opts) {\n    const {accessToken, container} = opts;\n    const options = {\n      accessToken,\n      component: {cover: true},\n      container,\n      imageId,\n    };\n    coverViewer = new Viewer(options);\n  }\n\n  return (\n    <div>\n      <ViewerComponent init={init} dispose={dispose} style={style} />\n      <ViewerComponent init={initCover} dispose={disposeCover} style={style} />\n    </div>\n  );\n}\n")),(0,o.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},"You can view the complete code for all ",(0,o.kt)("inlineCode",{parentName:"p"},"Viewer")," initialization behaviors in the ",(0,o.kt)("a",{parentName:"p",href:"/examples/viewer-initialization"},"Viewer Initialization")," example."))),(0,o.kt)("h2",{id:"viewer-options"},"Viewer Options"),(0,o.kt)("p",null,"The ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.vieweroptions"},"ViewerOptions")," give us a way to control some behaviors. First, we always specify an ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.vieweroptions#accesstoken"},"access token")," (when working with data from the Mapillary platform) and a ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.vieweroptions#container"},"container"),". The container can be an HTML element ID or an ",(0,o.kt)("a",{parentName:"p",href:"https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement"},"HTMLDivElement"),"."),(0,o.kt)("p",null,"The other options are optional. We can deactivate things like ",(0,o.kt)("em",{parentName:"p"},"image tiling"),", ",(0,o.kt)("em",{parentName:"p"},"combined panning"),", and ",(0,o.kt)("em",{parentName:"p"},"resize tracking"),". We can also change ",(0,o.kt)("em",{parentName:"p"},"render mode"),", ",(0,o.kt)("em",{parentName:"p"},"transition mode"),", and ",(0,o.kt)("em",{parentName:"p"},"camera control mode"),"."),(0,o.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},"Check the difference in pixel resolution when zooming with ",(0,o.kt)("inlineCode",{parentName:"p"},"imageTiling")," set to ",(0,o.kt)("inlineCode",{parentName:"p"},"true")," or ",(0,o.kt)("inlineCode",{parentName:"p"},"false"),"."),(0,o.kt)("p",{parentName:"div"},"Try resizing the browser window with ",(0,o.kt)("inlineCode",{parentName:"p"},"trackResize")," set to ",(0,o.kt)("inlineCode",{parentName:"p"},"true")," or ",(0,o.kt)("inlineCode",{parentName:"p"},"false"),". If you set ",(0,o.kt)("inlineCode",{parentName:"p"},"trackResize")," to ",(0,o.kt)("inlineCode",{parentName:"p"},"false"),", you can still programatically inform the ",(0,o.kt)("inlineCode",{parentName:"p"},"Viewer")," that it has been resized by calling the Viewer.",(0,o.kt)("a",{parentName:"p",href:"/api/classes/viewer.Viewer#resize"},"resize")," method."))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function render(props) {\n  let viewer;\n  function dispose() {\n    if (viewer) {\n      viewer.remove();\n    }\n  }\n  const style = {height: '400px'};\n  const imageId = '178975760792906';\n\n  function init(opts) {\n    const {accessToken, container} = opts;\n    const viewerOptions = {\n      accessToken,\n      cameraControls: CameraControls.Street,\n      combinedPanning: false,\n      component: {cover: false},\n      container,\n      imageId,\n      imageTiling: false,\n      renderMode: RenderMode.Letterbox,\n      trackResize: false,\n      transitionMode: TransitionMode.Instantaneous,\n    };\n    viewer = new Viewer(viewerOptions);\n  }\n\n  return <ViewerComponent init={init} dispose={dispose} style={style} />;\n}\n")),(0,o.kt)("h2",{id:"component-options"},"Component Options"),(0,o.kt)("p",null,"The ",(0,o.kt)("a",{parentName:"p",href:"/api/interfaces/viewer.componentoptions"},"ComponentOptions")," can be used to activate or deactivate all components by specifying a boolean value."),(0,o.kt)("p",null,"Most components also have a ",(0,o.kt)("a",{parentName:"p",href:"/api/modules/component#interfaces"},"configuration"),". The component configurations give us an opportunity to to do more fine grained component specific configuration. Specifying a component configuration for a component option property means that the component will be activated on initialization in the same way as setting its value to 'true'."),(0,o.kt)("p",null,"With component options can for example deactivate certain ",(0,o.kt)("em",{parentName:"p"},"pointer")," handlers to avoid interfering with the default browser scroll behavior or tell the ",(0,o.kt)("em",{parentName:"p"},"sequence")," component to play a sequence immediately on load."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"function render(props) {\n  let viewer;\n  function dispose() {\n    if (viewer) {\n      viewer.remove();\n    }\n  }\n  const style = {height: '400px'};\n  const imageId = '178975760792906';\n\n  function init(opts) {\n    const {accessToken, container} = opts;\n    const componentOptions = {\n      bearing: {size: ComponentSize.Large},\n      cache: false,\n      cover: false,\n      direction: {maxWidth: 300},\n      keyboard: {keyZoom: false},\n      pointer: {scrollZoom: false},\n      sequence: {visible: false, playing: false},\n      zoom: true,\n    };\n    const viewerOptions = {\n      accessToken,\n      component: componentOptions,\n      container,\n      imageId,\n    };\n    viewer = new Viewer(viewerOptions);\n  }\n\n  return <ViewerComponent init={init} dispose={dispose} style={style} />;\n}\n")),(0,o.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},"You can view the complete code for all initial ",(0,o.kt)("inlineCode",{parentName:"p"},"Viewer")," behaviors in the ",(0,o.kt)("a",{parentName:"p",href:"/examples/viewer-initialization"},"Viewer Initialization")," example."))),(0,o.kt)("h2",{id:"recap"},"Recap"),(0,o.kt)("p",null,"Now you know how to initialize the MapillaryJS Viewer with different interaction and visualization features by:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Activating or deactivating the ",(0,o.kt)("em",{parentName:"li"},"cover")," component"),(0,o.kt)("li",{parentName:"ul"},"Specifying viewer and component options that changes the behavior of MapillaryJS")))}m.isMDXComponent=!0}}]);