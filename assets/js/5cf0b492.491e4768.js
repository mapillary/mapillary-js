"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[6121],{3905:function(e,n,t){t.d(n,{Zo:function(){return d},kt:function(){return u}});var a=t(7294);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function l(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function i(e,n){if(null==e)return{};var t,a,r=function(e,n){if(null==e)return{};var t,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)t=o[a],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)t=o[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var p=a.createContext({}),s=function(e){var n=a.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):l(l({},n),e)),t},d=function(e){var n=s(e.components);return a.createElement(p.Provider,{value:n},e.children)},m={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},c=a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,o=e.originalType,p=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),c=s(t),u=r,k=c["".concat(p,".").concat(u)]||c[u]||m[u]||o;return t?a.createElement(k,l(l({ref:n},d),{},{components:t})):a.createElement(k,l({ref:n},d))}));function u(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var o=t.length,l=new Array(o);l[0]=c;var i={};for(var p in n)hasOwnProperty.call(n,p)&&(i[p]=n[p]);i.originalType=e,i.mdxType="string"==typeof e?e:r,l[1]=i;for(var s=2;s<o;s++)l[s]=t[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,t)}c.displayName="MDXCreateElement"},3449:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return l},contentTitle:function(){return i},metadata:function(){return p},toc:function(){return s},default:function(){return m}});var a=t(2122),r=t(9756),o=(t(7294),t(3905)),l={id:"component.KeyZoomHandler",title:"Class: KeyZoomHandler",sidebar_label:"KeyZoomHandler",custom_edit_url:null},i=void 0,p={unversionedId:"classes/component.KeyZoomHandler",id:"classes/component.KeyZoomHandler",isDocsHomePage:!1,title:"Class: KeyZoomHandler",description:"component.KeyZoomHandler",source:"@site/api/classes/component.KeyZoomHandler.md",sourceDirName:"classes",slug:"/classes/component.KeyZoomHandler",permalink:"/mapillary-js/api/classes/component.KeyZoomHandler",editUrl:null,version:"current",frontMatter:{id:"component.KeyZoomHandler",title:"Class: KeyZoomHandler",sidebar_label:"KeyZoomHandler",custom_edit_url:null},sidebar:"api",previous:{title:"KeySpatialNavigationHandler",permalink:"/mapillary-js/api/classes/component.KeySpatialNavigationHandler"},next:{title:"KeyboardComponent",permalink:"/mapillary-js/api/classes/component.KeyboardComponent"}},s=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Accessors",id:"accessors",children:[{value:"isEnabled",id:"isenabled",children:[]}]},{value:"Methods",id:"methods",children:[{value:"disable",id:"disable",children:[]},{value:"enable",id:"enable",children:[]}]}],d={toc:s};function m(e){var n=e.components,t=(0,r.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,a.Z)({},d,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".KeyZoomHandler"),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"KeyZoomHandler")," allows the user to zoom in and out using the\nfollowing key commands:"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"+"),": Zoom in.\n",(0,o.kt)("inlineCode",{parentName:"p"},"-"),": Zoom out."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"example"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},'var keyboardComponent = viewer.getComponent("keyboard");\n\nkeyboardComponent.keyZoom.disable();\nkeyboardComponent.keyZoom.enable();\n\nvar isEnabled = keyboardComponent.keyZoom.isEnabled;\n')),(0,o.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},(0,o.kt)("inlineCode",{parentName:"p"},"HandlerBase"),"<",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.KeyboardConfiguration"},(0,o.kt)("inlineCode",{parentName:"a"},"KeyboardConfiguration")),">"),(0,o.kt)("p",{parentName:"li"},"\u21b3 ",(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"KeyZoomHandler"))))),(0,o.kt)("h2",{id:"accessors"},"Accessors"),(0,o.kt)("h3",{id:"isenabled"},"isEnabled"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"isEnabled"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,"Returns a Boolean indicating whether the interaction is enabled."),(0,o.kt)("h4",{id:"returns"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"true")," if the interaction is enabled."),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/util/HandlerBase.ts#L31"},"component/util/HandlerBase.ts:31")),(0,o.kt)("h2",{id:"methods"},"Methods"),(0,o.kt)("h3",{id:"disable"},"disable"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"disable"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Disables the interaction."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"example"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"<component-name>.<handler-name>.disable();\n")),(0,o.kt)("h4",{id:"returns-1"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,o.kt)("p",null,"HandlerBase.disable"),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/util/HandlerBase.ts#L60"},"component/util/HandlerBase.ts:60")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"enable"},"enable"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"enable"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Enables the interaction."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"example"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"<component-name>.<handler-name>.enable();\n")),(0,o.kt)("h4",{id:"returns-2"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from-1"},"Inherited from"),(0,o.kt)("p",null,"HandlerBase.enable"),(0,o.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/util/HandlerBase.ts#L43"},"component/util/HandlerBase.ts:43")))}m.isMDXComponent=!0}}]);