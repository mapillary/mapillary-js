"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[356],{3905:function(t,e,n){n.d(e,{Zo:function(){return s},kt:function(){return f}});var r=n(7294);function a(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function o(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function i(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?o(Object(n),!0).forEach((function(e){a(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function p(t,e){if(null==t)return{};var n,r,a=function(t,e){if(null==t)return{};var n,r,a={},o=Object.keys(t);for(r=0;r<o.length;r++)n=o[r],e.indexOf(n)>=0||(a[n]=t[n]);return a}(t,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(r=0;r<o.length;r++)n=o[r],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(a[n]=t[n])}return a}var l=r.createContext({}),c=function(t){var e=r.useContext(l),n=e;return t&&(n="function"==typeof t?t(e):i(i({},e),t)),n},s=function(t){var e=c(t.components);return r.createElement(l.Provider,{value:e},t.children)},u={inlineCode:"code",wrapper:function(t){var e=t.children;return r.createElement(r.Fragment,{},e)}},m=r.forwardRef((function(t,e){var n=t.components,a=t.mdxType,o=t.originalType,l=t.parentName,s=p(t,["components","mdxType","originalType","parentName"]),m=c(n),f=a,d=m["".concat(l,".").concat(f)]||m[f]||u[f]||o;return n?r.createElement(d,i(i({ref:e},s),{},{components:n})):r.createElement(d,i({ref:e},s))}));function f(t,e){var n=arguments,a=e&&e.mdxType;if("string"==typeof t||a){var o=n.length,i=new Array(o);i[0]=m;var p={};for(var l in e)hasOwnProperty.call(e,l)&&(p[l]=e[l]);p.originalType=t,p.mdxType="string"==typeof t?t:a,i[1]=p;for(var c=2;c<o;c++)i[c]=n[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},2711:function(t,e,n){n.r(e),n.d(e,{frontMatter:function(){return i},contentTitle:function(){return p},metadata:function(){return l},toc:function(){return c},default:function(){return u}});var r=n(2122),a=n(9756),o=(n(7294),n(3905)),i={id:"component.SpotTagOptions",title:"Interface: SpotTagOptions",sidebar_label:"SpotTagOptions",custom_edit_url:null},p=void 0,l={unversionedId:"interfaces/component.SpotTagOptions",id:"interfaces/component.SpotTagOptions",isDocsHomePage:!1,title:"Interface: SpotTagOptions",description:"component.SpotTagOptions",source:"@site/api/interfaces/component.SpotTagOptions.md",sourceDirName:"interfaces",slug:"/interfaces/component.SpotTagOptions",permalink:"/mapillary-js/api/interfaces/component.SpotTagOptions",editUrl:null,tags:[],version:"current",frontMatter:{id:"component.SpotTagOptions",title:"Interface: SpotTagOptions",sidebar_label:"SpotTagOptions",custom_edit_url:null},sidebar:"api",previous:{title:"SpatialConfiguration",permalink:"/mapillary-js/api/interfaces/component.SpatialConfiguration"},next:{title:"TagConfiguration",permalink:"/mapillary-js/api/interfaces/component.TagConfiguration"}},c=[{value:"Properties",id:"properties",children:[{value:"color",id:"color",children:[]},{value:"editable",id:"editable",children:[]},{value:"icon",id:"icon",children:[]},{value:"text",id:"text",children:[]},{value:"textColor",id:"textcolor",children:[]}]}],s={toc:c};function u(t){var e=t.components,n=(0,a.Z)(t,["components"]);return(0,o.kt)("wrapper",(0,r.Z)({},s,n,{components:e,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".SpotTagOptions"),(0,o.kt)("p",null,"Interface for the options that define the behavior and\nappearance of the spot tag."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"interface"))),(0,o.kt)("h2",{id:"properties"},"Properties"),(0,o.kt)("h3",{id:"color"},"color"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,o.kt)("strong",{parentName:"p"},"color"),": ",(0,o.kt)("inlineCode",{parentName:"p"},"number")),(0,o.kt)("p",null,"Color for the spot specified as a hexadecimal number."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"default"))," 0xFFFFFF"),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/tag/interfaces/SpotTagOptions.ts#L12"},"component/tag/interfaces/SpotTagOptions.ts:12")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"editable"},"editable"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,o.kt)("strong",{parentName:"p"},"editable"),": ",(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,"Indicate whether the tag geometry should be editable."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/tag/interfaces/SpotTagOptions.ts#L18"},"component/tag/interfaces/SpotTagOptions.ts:18")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"icon"},"icon"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,o.kt)("strong",{parentName:"p"},"icon"),": ",(0,o.kt)("inlineCode",{parentName:"p"},"string")),(0,o.kt)("p",null,"A string referencing the sprite data property to pull from."),(0,o.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/tag/interfaces/SpotTagOptions.ts#L23"},"component/tag/interfaces/SpotTagOptions.ts:23")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"text"},"text"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,o.kt)("strong",{parentName:"p"},"text"),": ",(0,o.kt)("inlineCode",{parentName:"p"},"string")),(0,o.kt)("p",null,"Text shown as label if no icon is provided."),(0,o.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/tag/interfaces/SpotTagOptions.ts#L28"},"component/tag/interfaces/SpotTagOptions.ts:28")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"textcolor"},"textColor"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,o.kt)("strong",{parentName:"p"},"textColor"),": ",(0,o.kt)("inlineCode",{parentName:"p"},"number")),(0,o.kt)("p",null,"Text color as hexadecimal number."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"default"))," 0xFFFFFF"),(0,o.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/tag/interfaces/SpotTagOptions.ts#L34"},"component/tag/interfaces/SpotTagOptions.ts:34")))}u.isMDXComponent=!0}}]);