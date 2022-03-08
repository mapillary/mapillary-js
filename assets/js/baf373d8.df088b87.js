"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[4265],{3905:function(e,t,r){r.d(t,{Zo:function(){return c},kt:function(){return u}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var l=n.createContext({}),p=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},c=function(e){var t=p(e.components);return n.createElement(l.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),d=p(r),u=a,h=d["".concat(l,".").concat(u)]||d[u]||m[u]||o;return r?n.createElement(h,i(i({ref:t},c),{},{components:r})):n.createElement(h,i({ref:t},c))}));function u(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=d;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:a,i[1]=s;for(var p=2;p<o;p++)i[p]=r[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},3784:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return i},contentTitle:function(){return s},metadata:function(){return l},toc:function(){return p},default:function(){return m}});var n=r(2122),a=r(9756),o=(r(7294),r(3905)),i={id:"extend",title:"Extend MapillaryJS"},s=void 0,l={unversionedId:"extension/extend",id:"extension/extend",isDocsHomePage:!1,title:"Extend MapillaryJS",description:"MapillaryJS is a street imagery and semantic mapping visualization platform on the web. It is built from smaller units and some of them can be augmented or overridden by custom implementations. To make this possible, MapillaryJS exposes a set of extension APIs.",source:"@site/docs/extension/extend.md",sourceDirName:"extension",slug:"/extension/extend",permalink:"/mapillary-js/docs/extension/extend",editUrl:"https://github.com/mapillary/mapillary-js/edit/main/doc/docs/extension/extend.md",tags:[],version:"current",frontMatter:{id:"extend",title:"Extend MapillaryJS"},sidebar:"docs",previous:{title:"Working with Components",permalink:"/mapillary-js/docs/main/component"},next:{title:"Procedural Data Provider",permalink:"/mapillary-js/docs/extension/procedural-data-provider"}},p=[{value:"Custom Rendering",id:"custom-rendering",children:[{value:"Overview",id:"overview",children:[]}]}],c={toc:p};function m(e){var t=e.components,i=(0,a.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,n.Z)({},c,i,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"MapillaryJS is a street imagery and semantic mapping visualization platform on the web. It is built from smaller units and some of them can be augmented or overridden by custom implementations. To make this possible, MapillaryJS exposes a set of extension APIs."),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/api/classes/api.dataproviderbase"},"Data Provider API")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/api/interfaces/viewer.icustomrenderer"},"Custom Render API")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/api/interfaces/viewer.icustomcameracontrols"},"Custom Camera Control API"))),(0,o.kt)("p",null,"By the end of this section, you will be able to use these APIs to extend and augment the MapillaryJS experience with your own data, semantic meshes, 3D models, animations, editing capabilities, camera controls, and interactivity."),(0,o.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"You will learn")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("ul",{parentName:"div"},(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/extension/procedural-data-provider"},"How to write a data provider to render your own data in MapillaryJS")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/extension/geometry-provider"},"How to write a geometry provider optimized for your geo shapes and queries")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/extension/webgl-custom-renderer"},"How to render 3D objects using WebGL")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/extension/three-custom-renderer"},"How to render 3D objects using Three.js")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/extension/animation"},"How to create animations")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/extension/fly-controls"},"How to attach camera controls leveraging Three.js"))))),(0,o.kt)("h2",{id:"custom-rendering"},"Custom Rendering"),(0,o.kt)("p",null,"The custom render guides focus on rendering specific custom objects onto the MapillaryJS street imagery. It is worth noting that anything you can render with ",(0,o.kt)("a",{parentName:"p",href:"https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API"},"WebGL")," or ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/mrdoob/three.js/"},"Three.js")," in another context, you can also render inside the MapillaryJS. The inverse is also true, if you render some object in MapillaryJS, you can reuse that object in a WebGL or Three.js application somewhere else. To summarize, your 3D objects are reusable."),(0,o.kt)("h3",{id:"overview"},"Overview"),(0,o.kt)("p",null,"We go into the details of writing custom renderers in the guides, but the overview below explains how the custom render API works, step by step."),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"Custom Render Overview",src:r(8946).Z})),(0,o.kt)("p",null,(0,o.kt)("em",{parentName:"p"},"Custom render overview")),(0,o.kt)("p",null,"The custom render API works like this:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"We start at the top, in a web application. We want to render our own 3D models and meshes in MapillaryJS. To do that we create a custom renderer class implementing the ",(0,o.kt)("a",{parentName:"li",href:"/api/interfaces/viewer.icustomrenderer"},"ICustomRenderer")," interface."),(0,o.kt)("li",{parentName:"ol"},"In our application we instantiate a MapillaryJS viewer and add our custom renderer."),(0,o.kt)("li",{parentName:"ol"},"When we add our custom renderer, it becomes part of the MapillaryJS render pipeline."),(0,o.kt)("li",{parentName:"ol"},"Our custom renderer gets notified that it needs to render every time an update occurs. For each update, our ICustomRenderer.",(0,o.kt)("a",{parentName:"li",href:"/api/interfaces/viewer.icustomrenderer#render"},"render")," method implementation gets called with the WebGL context, the view matrix, and the projection matrix. We use the matrices to render directly onto the MapillaryJS canvas through the WebGL context.")),(0,o.kt)("p",null,"To dig deeper into the details, take a look at the custom render guides."))}m.isMDXComponent=!0},8946:function(e,t,r){t.Z=r.p+"assets/images/custom-render-design-43331a13f48449f3761efc518f7863f0.png"}}]);