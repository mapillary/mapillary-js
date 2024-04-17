"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[2929],{3905:function(e,n,t){t.d(n,{Zo:function(){return s},kt:function(){return m}});var r=t(7294);function i(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function a(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){i(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function l(e,n){if(null==e)return{};var t,r,i=function(e,n){if(null==e)return{};var t,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var p=r.createContext({}),d=function(e){var n=r.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):a(a({},n),e)),t},s=function(e){var n=d(e.components);return r.createElement(p.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},c=r.forwardRef((function(e,n){var t=e.components,i=e.mdxType,o=e.originalType,p=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),c=d(t),m=i,f=c["".concat(p,".").concat(m)]||c[m]||u[m]||o;return t?r.createElement(f,a(a({ref:n},s),{},{components:t})):r.createElement(f,a({ref:n},s))}));function m(e,n){var t=arguments,i=n&&n.mdxType;if("string"==typeof e||i){var o=t.length,a=new Array(o);a[0]=c;var l={};for(var p in n)hasOwnProperty.call(n,p)&&(l[p]=n[p]);l.originalType=e,l.mdxType="string"==typeof e?e:i,a[1]=l;for(var d=2;d<o;d++)a[d]=t[d];return r.createElement.apply(null,a)}return r.createElement.apply(null,t)}c.displayName="MDXCreateElement"},7599:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return a},contentTitle:function(){return l},metadata:function(){return p},toc:function(){return d},default:function(){return u}});var r=t(2122),i=t(9756),o=(t(7294),t(3905)),a={id:"viewer.RenderMode",title:"Enumeration: RenderMode",sidebar_label:"RenderMode",custom_edit_url:null},l=void 0,p={unversionedId:"enums/viewer.RenderMode",id:"enums/viewer.RenderMode",isDocsHomePage:!1,title:"Enumeration: RenderMode",description:"viewer.RenderMode",source:"@site/api/enums/viewer.RenderMode.md",sourceDirName:"enums",slug:"/enums/viewer.RenderMode",permalink:"/mapillary-js/api/enums/viewer.RenderMode",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.RenderMode",title:"Enumeration: RenderMode",sidebar_label:"RenderMode",custom_edit_url:null},sidebar:"api",previous:{title:"NavigationDirection",permalink:"/mapillary-js/api/enums/viewer.NavigationDirection"},next:{title:"RenderPass",permalink:"/mapillary-js/api/enums/viewer.RenderPass"}},d=[{value:"Enumeration members",id:"enumeration-members",children:[{value:"Fill",id:"fill",children:[]},{value:"Letterbox",id:"letterbox",children:[]}]}],s={toc:d};function u(e){var n=e.components,t=(0,i.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,r.Z)({},s,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".RenderMode"),(0,o.kt)("p",null,"Enumeration for render mode"),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"readonly"))),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"description"))," Modes for specifying how rendering is done\nin the viewer. All modes preserves the original aspect\nratio of the images."),(0,o.kt)("h2",{id:"enumeration-members"},"Enumeration members"),(0,o.kt)("h3",{id:"fill"},"Fill"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"Fill")," = ",(0,o.kt)("inlineCode",{parentName:"p"},"1")),(0,o.kt)("p",null,"Fills the viewer by cropping content."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"description"))," Cropping is done either\nin horizontal or vertical direction\ndepending on the aspect ratio relation\nbetween the image and the viewer."),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/render/RenderMode.ts#L31"},"render/RenderMode.ts:31")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"letterbox"},"Letterbox"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"Letterbox")," = ",(0,o.kt)("inlineCode",{parentName:"p"},"0")),(0,o.kt)("p",null,"Displays all content within the viewer."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"description"))," Black bars shown on both\nsides of the content. Bars are shown\neither below and above or to the left\nand right of the content depending on\nthe aspect ratio relation between the\nimage and the viewer."),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/render/RenderMode.ts#L21"},"render/RenderMode.ts:21")))}u.isMDXComponent=!0}}]);