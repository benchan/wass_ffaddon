const XHTMLNS = 'http://www.w3.org/1999/xhtml';

wass.prototype = {
	$: function(id) {
		return document.getElementById(id);
	},
	
	load: function(){
	
		this.olddata = "";
		
		// パネル作る
		this._panel = document.createElement("panel");
		this._panel.setAttribute("noautofocus", "true");
		this._panel.setAttribute("noautohide", "true");
		this._panel.id = "wass_panel";
		
		// ポップアップウィンドウ作る
		this._popup = document.createElement("vbox");
		this._popup.className = "wass_popup";
		this._popup.text = "";
		this._panel.appendChild(this._popup);
		
		var popupset = this.$("wass-popupset");
		popupset.appendChild(this._panel);
		
		this._username=this.getPref("username", "wass.");
		this._password=this.getPref("password", "wass.");
		this._updatetime=this.getPref("updatetime", "wass.");
		
		if(this._updatetime==""){
			this._updatetime = 15;
		}
		
		this._basic = btoa(this._username + ":" + this._password);
		
		this.Followers = "";
		this.FollowersPage = 1;
		
		this.getFollowersData();
		
		this._photoCool = 1;
	},
	
	onMenuItemCommand: function(e) {
	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
								  .getService(Components.interfaces.nsIPromptService);
	// promptService.alert(window, this.strings.getString("helloMessageTitle"),
	//                             this.strings.getString("helloMessage"));
	},

	//アイコンクリックステータスバー
	onClickStatusbarIcon: function(e){

		if (e.button == 0 && e.detail == 1) { //button 0: 左　1：真ん中　2:右クリック
			this.isOpen = !this.isOpen ? true : false;
			
			if(this.isOpen){
				
				var button = this.$("status-bar");	
				this._panel.openPopup(button, "before_end", -17, -3, false, false);
				
				if(this._username && this._password){
					// Application.console.log(this._username+"--"+this._password);
					this.getData();
				}else{ 
					window.openDialog("chrome://wass/content/prefs.xul", 'Preferences', 'chrome,titlebar,toolbar,centerscreen,modal');
					this.setPref();
				}

			}else{
			
				this._panel.hidePopup();
			}
		}
		this.$("wass-statusbar-button").style.listStyleImage = 'url(chrome://wass/skin/wass16.png)';

	},
	
	createImgElm: function(_src){
	 
	  var elm = document.createElement("image");
	  elm.setAttribute("src", _src);
	  
	  return elm;
	  
	},
	
	onEnter: function(e){ //インプット送信
	
		if(e.ctrlKey
			&& (e.keyCode == e.DOM_VK_ENTER || e.keyCode == e.DOM_VK_RETURN)
			&& this.$("wass_input").value){
			
			this.sendHitokoto();
		}
	
	},
	
	onEnterChannel: function(e){ //インプット送信
	
		if(e.ctrlKey
			&& (e.keyCode == e.DOM_VK_ENTER || e.keyCode == e.DOM_VK_RETURN)
			&& this.$("wass_input_channel").value){
			
			this.sendHitokotoChannel();
		}
	
	},
	
	onEnterOwner: function(e){ //インプット送信
	
		if(e.ctrlKey
			&& (e.keyCode == e.DOM_VK_ENTER || e.keyCode == e.DOM_VK_RETURN)
			&& this.$("wass_input_owner").value){
			this.sendHitokoto();
		}
	
	},
	
	onEnterRes: function(e){ //インプット送信
	
		if(e.ctrlKey
			&& (e.keyCode == e.DOM_VK_ENTER || e.keyCode == e.DOM_VK_RETURN)
			&& this.$("wass_input_res").value){
			this.sendHitokoto();
		}
	
	},	
	
	onEnterPublic: function(e){ //インプット送信
	
		if(e.ctrlKey
			&& (e.keyCode == e.DOM_VK_ENTER || e.keyCode == e.DOM_VK_RETURN)
			&& this.$("wass_input_public").value){
			this.sendHitokoto();
		}
	
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	catchDragEvents: function (e){
		
		switch (e.type) {
			case "dragenter":
			case "dragover":
				e.preventDefault();
				break;
				
			
			case "drop":
		
				
				var data = e.dataTransfer.getData("text/uri-list");
				Application.console.log(data);
		
		
					var img = new Image();
					var ctx = document.getElementById('wass_canvas').getContext('2d');
					
					img.onload=function(){
						ctx.drawImage(img,0,0);
					}
					img.src=data;
				
					//現在の表示中のキャプチャを取得できる
					//ctx.drawWindow(gBrowser.contentWindow, 0, 0, window.innerWidth, window.innerHeight, "rgb(255,255,255)");
				
				e.preventDefault();
				break;
   		}
		
		
	},
	
	//選択範囲をキャプチャする。
	getCaptureSelection: function(_x, _y, _width, _height){
		
		var wassRect = gBrowser.contentWindow.document.getElementById("wass-capture-box");
		var wassScreen = gBrowser.contentWindow.document.getElementById("wass-capture-screen");
		gBrowser.contentWindow.document.getElementsByTagName("body")[0].removeChild(wassRect);
		gBrowser.contentWindow.document.getElementsByTagName("body")[0].removeChild(wassScreen);

		var canvas = document.getElementById('wass_canvas');
		var ctx = canvas.getContext('2d');

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		canvas.width = _width;
		canvas.height = _height;
		
/*		if(canvas.width < _width){
			ctx.scale(canvas.width/_width, canvas.width/_width);
		}else{
			ctx.scale(1, 1);
		}*/
		
		
		ctx.drawWindow(gBrowser.contentWindow, _x, _y, _width, _height, "rgb(255,255,255)");
		Application.console.log(canvas.width);

	},
	
	//選択範囲をキャプチャする。
	setCapture: function(){
	
//		openDialog(
//			'chrome://wass/content/quickPostForm.xul', 
//			'chrome,alwaysRaised=yes,resizable=yes,titlebar=no,dependent=yes');
//		
		wass.capX="";
		wass.capY="";
		
		
		wassScreen = gBrowser.contentWindow.document.createElement("div");
		wassScreen.setAttribute("id", "wass-capture-screen");
		
		gBrowser.contentWindow.document.getElementsByTagName("body")[0].appendChild(wassScreen);
		
		wassScreen.style.backgroundColor="orange";
		wassScreen.style.position="absolute";
		wassScreen.style.zIndex=50;
		wassScreen.style.MozOpacity = 0.3;
		
		wassScreen.style.left ="0px";
		wassScreen.style.top = "0px";
		wassScreen.style.width = gBrowser.contentWindow.document.getElementsByTagName("html")[0].scrollWidth + "px"; //"100%";
		wassScreen.style.height = gBrowser.contentWindow.document.getElementsByTagName("html")[0].scrollHeight + "px";
		
		gBrowser.contentWindow.addEventListener("mousedown", this.startCapture, true);
		
	},

	startCapture: function(e){
		
		wass.capX = e.clientX + gBrowser.contentWindow.scrollX;
		wass.capY = e.clientY + gBrowser.contentWindow.scrollY;
												
		
		var wassRect = gBrowser.contentWindow.document.getElementById("wass-capture-box");
		if (wassRect == null) {
			wassRect = gBrowser.contentWindow.document.createElement("div");
			wassRect.setAttribute("id", "wass-capture-box");
			
			gBrowser.contentWindow.document.getElementsByTagName("body")[0].appendChild(wassRect);
		}
		wassRect.style.backgroundColor="yellow";
		wassRect.style.borderStyle="dashed";
		wassRect.style.borderWidth="1px";
		wassRect.style.position="absolute";
		wassRect.style.zIndex=100;
		wassRect.style.MozOpacity = 0.6;
		
		wassRect.style.left = wass.capX + "px";
		wassRect.style.top = wass.capY + "px";
		
		gBrowser.contentWindow.document.addEventListener("mousemove", wass.nowCapturing, true);
		gBrowser.contentWindow.document.addEventListener("mouseup", wass.endCapture, true);

		gBrowser.contentWindow.removeEventListener("mousedown", arguments.callee, true);
	
	},
	
	nowCapturing: function(e){

		var wassRect = gBrowser.contentWindow.document.getElementById("wass-capture-box");
		
		var _xmouse = e.clientX + gBrowser.contentWindow.scrollX;
		var _ymouse = e.clientY + gBrowser.contentWindow.scrollY;
		
		var _left = _xmouse < wass.capX ? _xmouse : wass.capX;
		var _top  = _ymouse < wass.capY ? _ymouse : wass.capY;
		
		var _width  = Math.abs(_xmouse - wass.capX);
		var _height = Math.abs(_ymouse - wass.capY);
		
		wassRect.style.left = _left + "px";
		wassRect.style.top = _top + "px";
		wassRect.style.width = _width + "px";
		wassRect.style.height = _height + "px";
	
	},
	
	endCapture: function(e){
		
		var wassRect = gBrowser.contentWindow.document.getElementById("wass-capture-box");

		gBrowser.contentWindow.document.removeEventListener("mousemove", wass.nowCapturing, true);
		gBrowser.contentWindow.document.removeEventListener("mouseup", wass.endCapture, true);
	
		wass.getCaptureSelection(wassRect.offsetLeft, wassRect.offsetTop, wassRect.clientWidth, wassRect.clientHeight);

	},
	
	
	sendHitokotoChannel: function(){ //ヒトコトチャンネル
	
		var name_en = this.$("wass_content_channel_title").getAttribute("displaynow");
	
		var xmlURL_self = 'http://api.wassr.jp/channel_message/update.json?name_en=' + name_en;
		var req = new XMLHttpRequest();
		req.open("POST",xmlURL_self,true);
		req.setRequestHeader("Authorization" , "Basic " + this._basic);
		
/*
		var file=this.$("wassfile").files[0];
		
		var fileName = file.fileName; // ファイル名
		var fileSize = file.fileSize; // ファイルサイズ (バイト単位)
		var dataURL = file.getAsDataURL(); // ファイルの中身を data: URL として取得する
		var binary = file.getAsBinary(); 
		var fpath = this.$("wassfile").value;
*/		
		
//		var img = new Image();
//		var ctx = document.getElementById('wass_canvas').getContext('2d');
//		
//		img.onload=function(){
//			ctx.drawImage(img,0,0);
//		}
//		img.src=dataURL;

		var dataURL = document.getElementById('wass_canvas').toDataURL();////////---------------------------------
		var _imguri=dataURL.split('data:image/png;base64,');
		var imagedata = atob(_imguri[1]);
		var fileName = "canvas.png";
		
		
		binary = imagedata;
		
		// Try to determine the MIME type of the file  
		var mimeType = "application/octet-stream";  
		try {
			var aFile = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
			aFile.initWithPath(fpath);
			var mimeService = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);  
			mimeType = mimeService.getTypeFromFile(aFile); // file is an nsIFile instance  
		}  
		catch(e) { /* eat it; just use text/plain */ }  


		var boundary = "--------XX" + Math.random();
		req.setRequestHeader("Content-type", "multipart/form-data; boundary=" + boundary);

		
		var prefixText = "--" + boundary + "\n" +
					"Content-type: text/plain;charset=UTF-8\n" +
					"Content-Disposition: form-data; name=\"body\" " + "\n\n";
				   
		prefixText += this.$("wass_input_channel").value;
		prefixText += "\n";


		if(this.$("wass_resname_channel").getAttribute("title")){
		
			var prefix_rid = "--" + boundary + "\n" +
						"Content-type: text/plain;charset=UTF-8\n" +
						"Content-Disposition: form-data; name=\"reply_channel_message_rid\" " + "\n\n";
					   
			prefix_rid += this.$("wass_resname_channel").getAttribute("title");
			prefix_rid += "\n";
			prefixText = prefix_rid + prefixText;
		}

		
		
		var prefixImg = "--" + boundary + "\n" +
					"Content-type: " + mimeType + "\n" +
					"Content-Transfer-Encoding: binary\n" +
					"Content-Disposition: form-data; name=\"image\"; filename=\"" +	fileName + "\"\n" +
					"\n";
				   
		
	//////////////////////////マルチデータ////////////////////////////////////////////////////	
		
		var prefixStringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
		prefixStringInputStream.setData(prefixImg, prefixImg.length);

		var binaryOutputStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
		var storageStream = Components.classes["@mozilla.org/storagestream;1"].createInstance(Components.interfaces.nsIStorageStream);
		storageStream.init(4096, binary.length, null);
		binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
		binaryOutputStream.writeBytes(binary, binary.length);
		binaryOutputStream.close();
		

		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var suffixStringInputStream = converter.convertToInputStream(prefixText);
		
		
		var lastline = "\n" + boundary + "--";
		var lastStringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
		lastStringInputStream.setData(lastline, lastline.length);

		// multiplex the streams together/////////////////////
		var multiStream = Components.classes["@mozilla.org/io/multiplex-input-stream;1"].createInstance(Components.interfaces.nsIMultiplexInputStream);
		multiStream.appendStream(suffixStringInputStream);
		
		if(document.getElementById("wass_splitter").getAttribute("state") == "open"){
		
		multiStream.appendStream(prefixStringInputStream);
		multiStream.appendStream(storageStream.newInputStream(0));
		
		}
		
		multiStream.appendStream(lastStringInputStream);
		
		// multiplex the streams together/////////////////////
		
		req.setRequestHeader("Content-length", multiStream.available());
		req.send(multiStream);
		
	//////////////////////////////////////////////////////////////////////////////	

		this.resModeChannelOff();

		req.onreadystatechange = function(){
			
			if(req.readyState==4 && req.status==200){
				Application.console.log(req.responseText);
				wass.getChannelsData(name_en);
			}
		}
		
		
	},
	
	sendHitokoto: function(){ //ヒトコト
		var xmlURL_self = 'http://api.wassr.jp/statuses/update.json';
		var req = new XMLHttpRequest();
		req.open("POST",xmlURL_self,true);
		req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
		req.setRequestHeader("Authorization" , "Basic " + this._basic);
/*		
		var sendMsg = [];
		sendMsg.status=["status", this.$("wass_input").value];
		sendMsg.source=["source",""];
		sendMsg.rid=["reply_status_rid", this.$("wass_resname").getAttribute("title")];
		sendMsg.img=["image",""];
		

		sendMsg.data = [sendMsg.status.join("="),
						sendMsg.source.join("="),
						sendMsg.rid.join("="),
						sendMsg.img.join("=")
						];
	
		req.send(sendMsg.data.join("&amp;")); 
*/		
		
		var dataURL = document.getElementById('wass_canvas').toDataURL();
		var _imguri=dataURL.split('data:image/png;base64,');
		var imagedata = atob(_imguri[1]);
		var fileName = "canvas.png";
		
		binary = imagedata;
		
		// Try to determine the MIME type of the file  
		var mimeType = "application/octet-stream";  
		try {
			var aFile = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
			aFile.initWithPath(fpath);
			var mimeService = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);  
			mimeType = mimeService.getTypeFromFile(aFile); // file is an nsIFile instance  
		}  
		catch(e) { /* eat it; just use text/plain */ }  


		var boundary = "--------XX" + Math.random();
		req.setRequestHeader("Content-type", "multipart/form-data; boundary=" + boundary);

		var prefixText = "--" + boundary + "\n" +
					"Content-type: text/plain;charset=UTF-8\n" +
					"Content-Disposition: form-data; name=\"status\" " + "\n\n";
				   
		prefixText += this.$("wass_input").value;
		prefixText += "\n";
		
		var prefix_source = "--" + boundary + "\n" +
					"Content-type: text/plain;charset=UTF-8\n" +
					"Content-Disposition: form-data; name=\"source\" " + "\n\n";
				   
		prefix_source += 'FireWassr';
		prefix_source += "\n";
		prefixText = prefix_source + prefixText;
		
		if(this.$("wass_resname").getAttribute("title")){
		
			var prefix_rid = "--" + boundary + "\n" +
						"Content-type: text/plain;charset=UTF-8\n" +
						"Content-Disposition: form-data; name=\"reply_status_rid\" " + "\n\n";
					   
			prefix_rid += this.$("wass_resname").getAttribute("title");
			prefix_rid += "\n";
			prefixText = prefix_rid + prefixText;
		}
		
		
		var prefixImg = "--" + boundary + "\n" +
					"Content-type: " + mimeType + "\n" +
					"Content-Transfer-Encoding: binary\n" +
					"Content-Disposition: form-data; name=\"image\"; filename=\"" +	fileName + "\"\n" +
					"\n";
				   
		
	//////////////////////////マルチデータ////////////////////////////////////////////////////	
		
		var prefixStringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
		prefixStringInputStream.setData(prefixImg, prefixImg.length);

		var binaryOutputStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
		var storageStream = Components.classes["@mozilla.org/storagestream;1"].createInstance(Components.interfaces.nsIStorageStream);
		storageStream.init(4096, binary.length, null);
		binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
		binaryOutputStream.writeBytes(binary, binary.length);
		binaryOutputStream.close();
		

		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var suffixStringInputStream = converter.convertToInputStream(prefixText);
		
		
		var lastline = "\n" + boundary + "--";
		var lastStringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
		lastStringInputStream.setData(lastline, lastline.length);

		// multiplex the streams together/////////////////////
		var multiStream = Components.classes["@mozilla.org/io/multiplex-input-stream;1"].createInstance(Components.interfaces.nsIMultiplexInputStream);	
		multiStream.appendStream(suffixStringInputStream);
		//
		
		if(document.getElementById("wass_splitter").getAttribute("state") == "open"){
			multiStream.appendStream(prefixStringInputStream);
			multiStream.appendStream(storageStream.newInputStream(0));
		}
		
		multiStream.appendStream(lastStringInputStream);
		
		// multiplex the streams together/////////////////////
		
		req.setRequestHeader("Content-length", multiStream.available());
		req.send(multiStream);
		
	//////////////////////////////////////////////////////////////////////////////	
	
	
	this.resModeOff();
	
		
		req.onreadystatechange = function(){
			
			if(req.readyState==4 && req.status==200){
				wass.getData();
			}
		}
		
		
	},
	//イイネ！
	sendIine: function(target){
	
		if(target.getAttribute("fav") == "done"){
			var xmlURL_self = 'http://api.wassr.jp/favorites/destroy/' + target.getAttribute("rid") + '.json';
		}else{
			var xmlURL_self = 'http://api.wassr.jp/favorites/create/' + target.getAttribute("rid") + '.json';
		}
		
		var req = new XMLHttpRequest();
		req.open("POST",xmlURL_self,true);
		req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
		req.setRequestHeader("Authorization" , "Basic " + this._basic);
		
		req.send(""); 

		req.onreadystatechange = function(){
			
			if(req.readyState==4 && req.status==200){
				
				var _jsonData = JSON.parse(req.responseText);
				
				if(_jsonData.status == "ok"){
					if(target.getAttribute("fav") == ""){
						target.setAttribute("fav","done");
					}else{
						target.setAttribute("fav","");
					}
				}

			}
		}
	
	},
	
	//チャンネル イイネ！
	sendChannelIine: function(target){
	
		var xmlURL_self = 'http://api.wassr.jp/channel_favorite/toggle.json?channel_message_rid=' + target.getAttribute("rid");
		
		var req = new XMLHttpRequest();
		req.open("POST",xmlURL_self,true);
		req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
		req.setRequestHeader("Authorization" , "Basic " + this._basic);
		
		req.send(""); 

		req.onreadystatechange = function(){

			if(req.readyState==4 && req.status==200){
				
				var _jsonData = JSON.parse(req.responseText);
				
				if(_jsonData.message == "created"){
					target.setAttribute("fav","done");
				}else if(_jsonData.message == "removed"){
					target.setAttribute("fav","");
				}

			}
		}
	
	},
	
	checkIine: function(arr){ //イイネしてあるのか
	
		var myid = this._username;
        for (var i = 0; i < arr.length; i++) {
        
            if( arr[i] === myid){
                return true;
            }
        }
        return false;
	
	},
	
	onFollowers: function(data){ //イイネしてあるのか
	
	var _jsonData = JSON.parse(data);
		
        for (var i = 0; i < _jsonData.length; i++) {
 
            if( _jsonData[i].screen_name ){
				
                 this.Followers += _jsonData[i].screen_name + "," ;
            }
        }
		
		if(_jsonData.length == 100){
			this.FollowersPage++;
			this.getFollowersData(this.FollowersPage);
		}else{
			Application.console.log(this.Followers + " " + this.FollowersPage);
			intervalID = setInterval(function() { wass.getData(); }, this._updatetime * 1000);	
		}
		
	},
	
	getFollowersData: function(page){ //フォロワー
		
		if(this._username && this._password){
			var xmlURL_self = 'http://api.wassr.jp/statuses/followers.json';

			if(page){ xmlURL_self += "?page=" + page; }
			
			var req = new XMLHttpRequest();
			req.open("POST",xmlURL_self,true);
			req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
			req.setRequestHeader("Authorization" , "Basic " + this._basic);
		
			req.send(""); 
		}else{ 
			window.openDialog("chrome://wass/content/prefs.xul", 'Preferences', 'chrome,titlebar,toolbar,centerscreen,modal');
			this.setPref();
		}
		
		req.onreadystatechange = function(){
			
			if(req.readyState==4 && req.status==200){
				wass.onFollowers(req.responseText);
			}else if(req.readyState==4 && req.status > 200){
				alert("error. ID or Passが違うかネットワークエラーかな");
			}
		} 
	},
	
  
	getData: function(e){
	
		if(this._username && this._password){
			// var xmlURL_self = 'http://api.wassr.jp/statuses/friends_timeline.json?id=' + this._username;
			// var req = new XMLHttpRequest();
			// req.open("GET", xmlURL_self, true);
			// req.send(null);
			
			var xmlURL_self = 'http://api.wassr.jp/statuses/friends_timeline.json';
			var req = new XMLHttpRequest();
			req.open("POST",xmlURL_self,true);
			req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
			req.setRequestHeader("Authorization" , "Basic " + this._basic);
			req.setRequestHeader("User-Agent" , "FireWassr");
			
			// req.send("id="+this._username); 
			req.send(null); 
			
		}
		
		req.onreadystatechange = function(){
			Application.console.log(req.responseText);
			if(req.readyState==4 && req.status==200){
				wass.onGetData(req.responseText);
			}else if(req.readyState==4 && req.status > 200){
				alert("error. ID or Passが違うかネットワークエラーかな");
			}
		} 
	},
  
	onGetData: function(data){
	
		if(this.olddata != data || this.isOpen){
			this.olddata = data;
			if(!this.isOpen){
				this.$("wass-statusbar-button").style.listStyleImage = 'url(chrome://wass/skin/wass16over.png)';
			}			
			
	
			var _jsonData = JSON.parse(data);
			
			var _wassContentArea = this.$("wass_content");
			_wassContentArea.textContent = "";
				
			for(var i=0; i<_jsonData.length; i++){
			
				var _hbox = document.createElement("hbox");
				_hbox.setAttribute("class", "comment_box");
				
				//フォロワ？
				var Re = new RegExp(_jsonData[i].user_login_id, "i");
				if(this.Followers.search(Re) >= 0){
					_hbox.setAttribute("class", "comment_box_follow");
				}
				
				
				var _vbox = document.createElement("vbox"); //右
				_vbox.setAttribute("class", "right");
				
				
				var _img = this.createImgElm(_jsonData[i].user.profile_image_url);
				
				_img.setAttribute("width", "32");
				_img.setAttribute("height", "32");
				_img.setAttribute("class", "user_img");
				_img.setAttribute("tooltiptext", _jsonData[i].user.screen_name);
				
				var _a = document.createElementNS(XHTMLNS, 'a');
	      		_a.setAttribute("href", _jsonData[i].link);
	      		_a.setAttribute("class", "user_img");
				_a.setAttribute("onclick", 'return wass.openURI(this.href);');
				_a.appendChild(_img);
				
				var _p_res = document.createElementNS(XHTMLNS, 'p');
				_p_res.setAttribute("class", "restxt");
				
				if(_jsonData[i].reply_user_login_id){
					if(_jsonData[i].reply_message){
					
						var _rep = _jsonData[i].reply_message.replace(/>/g, "&gt;");
						_rep = _rep.replace(/</g, "&lt;");

					}else{
						var _rep = '友達のみに公開です ';
					}
					
					var _repUserNick = _jsonData[i].reply_user_nick.replace(/>/g, "&gt;");
					_repUserNick = _repUserNick.replace(/</g, "&lt;");
					
					var _res = ' > ' + _rep + 'by ' +  _repUserNick + "\n";
					_p_res.innerHTML=_res;
						
				}

				var _my_vbox = document.createElement("vbox");
				_my_vbox.setAttribute("class", "left");
				_my_vbox.appendChild(_a);
				
				var _img_iine = document.createElement("image");
				_img_iine.setAttribute("class", "fav_button");
				_img_iine.setAttribute("tooltiptext", "イイネ!");
				_img_iine.setAttribute("rid", _jsonData[i].rid);
				
				if(this.checkIine(_jsonData[i].favorites)){
					_img_iine.setAttribute("fav", "done");
				}
				
				_img_iine.setAttribute("onclick", "wass.sendIine(this);");
				_my_vbox.appendChild(_img_iine);
				
				var _p = document.createElementNS(XHTMLNS, 'p');
				//_p.innerHTML=_jsonData[i].html;
				_p.appendChild(this.textToEmoji(_jsonData[i].html));
				
				
				var _resanch = document.createElementNS(XHTMLNS, 'a');
	      		_resanch.setAttribute("title", _jsonData[i].user.screen_name);
	      		_resanch.setAttribute("rel", _jsonData[i].rid);
	      		_resanch.setAttribute("class", "res_anch");
				_resanch.setAttribute("onclick", 'wass.resModeOn(this.rel, this.title);');
				_resanch.innerHTML = " レス";
				_p.appendChild(_resanch);
				
				
				var _date = document.createElementNS(XHTMLNS, 'p');
				_date.setAttribute("class", "date");
				var _dateObj = new Date(_jsonData[i].epoch*1000);
				_date.innerHTML = _dateObj.toLocaleString();
				_p.appendChild(_date);
					
				
				
				_vbox.appendChild(_p_res);
				_vbox.appendChild(_p);
				
				
				if(_jsonData[i].photo_thumbnail_url){
					
					var _photo_img = this.createImgElm(_jsonData[i].photo_thumbnail_url);
					_photo_img.setAttribute("class", "user_photo");
					_photo_img.setAttribute("photosrc", _jsonData[i].photo_url);
					_photo_img.setAttribute("onclick", "wass.openURI(this.getAttribute('photosrc'));");
					
					var _p_photoImg = document.createElementNS(XHTMLNS, 'p');
					_p_photoImg.setAttribute("class", "user_photo");
					_p_photoImg.appendChild(_photo_img);
					_vbox.appendChild(_p_photoImg);
				
				}
				
				
				if(_favs = this.makeFavoritesIcon(_jsonData[i].favorites)){
					_vbox.appendChild(_favs);
					//my config
					if(this.Followers.search(Re) >= 0 && _jsonData[i].photo_thumbnail_url && _jsonData[i].user_login_id != wass._username && this._photoCool){
						if(_img_iine.getAttribute("fav") != "done"){
							wass.sendIine(_img_iine);
						}
					}
				}
				

			
				_hbox.appendChild(_my_vbox);
				_hbox.appendChild(_vbox);
				_wassContentArea.appendChild(_hbox);
				
							
				//Application.console.log();
			}
			
			
		}//data check
			
	},
	
	getChannels: function(){ //参加中チャンネル一覧
		var xmlURL_self = 'http://api.wassr.jp/channel_user/user_list.json?login_id=' + this._username;

		var req = new XMLHttpRequest();
		req.open("GET", xmlURL_self, true);
		req.send(null);
		
		req.onreadystatechange = function(){
			
			if(req.readyState==4 && req.status==200){
			
				var _json = JSON.parse(req.responseText);
				
				var _jsonData = _json.channels;
				var _channelTitles = wass.$("wass_content_channel_title");
				var _p_photoImg = document.createElementNS(XHTMLNS, 'p');

				if(_channelTitles.firstChild){
					_channelTitles.removeChild(_channelTitles.firstChild);
				}
				
				for(var i=0; i<_jsonData.length; i++){

					var _img = wass.createImgElm(_jsonData[i].image_url);
				
					_img.setAttribute("width", "24");
					_img.setAttribute("height", "24");
					_img.setAttribute("class", "channel_img");
					_img.setAttribute("name_en", _jsonData[i].name_en);
					_img.setAttribute("tooltiptext", _jsonData[i].title);

					_img.setAttribute("onclick", "wass.getChannelsData(this.getAttribute('name_en'));");
			
					_p_photoImg.appendChild(_img);
				}
				_channelTitles.appendChild(_p_photoImg);
			}
		} 
	},
	
	getChannelsData: function(name_en){ //参加中チャンネルのひとこと

		if(name_en){
			
			this.$("wass_content_channel_title").setAttribute("displaynow", name_en);
			
			var xmlURL_self = 'http://api.wassr.jp/channel_message/list.json?name_en=' + name_en;

			var req = new XMLHttpRequest();
			req.open("GET", xmlURL_self, true);
			req.send(null);
			
			req.onreadystatechange = function(){
				
				if(req.readyState==4 && req.status==200){
					wass.onGetChannelData(req.responseText);
				}
			}
		}
	},
	
	
	onGetChannelData: function(data){
		
		var _jsonData = JSON.parse(data);
		
		var _wassContentArea = this.$("wass_content_channel");
		_wassContentArea.textContent = "";
		
			
		for(var i=0; i<_jsonData.length; i++){
		
			var _hbox = document.createElement("hbox");
			_hbox.setAttribute("class", "comment_box");
			
			//フォロワ？
			var Re = new RegExp(_jsonData[i].user.login_id, "i");
			if(this.Followers.search(Re) >= 0){
				_hbox.setAttribute("class", "comment_box_follow");
			}			
			
			
			var _vbox = document.createElement("vbox"); //右
			_vbox.setAttribute("class", "right");
			
			
			var _img = this.createImgElm(_jsonData[i].user.profile_image_url);
			
			_img.setAttribute("width", "32");
			_img.setAttribute("height", "32");
			_img.setAttribute("class", "user_img");
			_img.setAttribute("tooltiptext", _jsonData[i].user.nick);
			
			var userLink = ['http://wassr.jp/channel/', _jsonData[i].channel.name_en, '/messages/', _jsonData[i].rid];			
			
			var _a = document.createElementNS(XHTMLNS, 'a');
      		_a.setAttribute("href", userLink.join(''));
      		_a.setAttribute("class", "user_img");
			_a.setAttribute("onclick", 'return wass.openURI(this.href);');
			_a.appendChild(_img);
			
	
			var _p_res = document.createElementNS(XHTMLNS, 'p');///////////////////////////////////////////////
			_p_res.setAttribute("class", "restxt");
			if(_jsonData[i].reply){
			
				//var _rep = _jsonData[i].reply.html.replace(/>/g, "&gt;");
				//_rep = _rep.replace(/</g, "&lt;");
				
				var _rep = _jsonData[i].reply.html;

				var _res = ' > ' + _rep + 'by ' +  _jsonData[i].reply.user.nick + "\n";
				_p_res.innerHTML=_res;
			}

			var _my_vbox = document.createElement("vbox");
			_my_vbox.setAttribute("class", "left");
			_my_vbox.appendChild(_a);
			
			var _img_iine = document.createElement("image");
			_img_iine.setAttribute("class", "fav_button");
			_img_iine.setAttribute("tooltiptext", "イイネ!");
			_img_iine.setAttribute("rid", _jsonData[i].rid);
			
			if(this.checkIine(_jsonData[i].favorites)){
				_img_iine.setAttribute("fav", "done");
			}
			
			_img_iine.setAttribute("onclick", "wass.sendChannelIine(this);");
			_my_vbox.appendChild(_img_iine);
			
			var _p = document.createElementNS(XHTMLNS, 'p');
			//_p.innerHTML=_jsonData[i].html;
			_p.appendChild(this.textToEmoji(_jsonData[i].html));
			
			
			var _resanch = document.createElementNS(XHTMLNS, 'a');
			_resanch.setAttribute("title", _jsonData[i].user.nick);
			_resanch.setAttribute("rel", _jsonData[i].rid);
			_resanch.setAttribute("class", "res_anch");
			_resanch.setAttribute("onclick", 'wass.resModeChannelOn(this.rel, this.title);');
			_resanch.innerHTML = " レス";
			_p.appendChild(_resanch);
			
			
			
			var _date = document.createElementNS(XHTMLNS, 'p');
			_date.setAttribute("class", "date");
			var _dateObj = new Date(_jsonData[i].created_on)
			_date.innerHTML = _dateObj.toLocaleString();
			_p.appendChild(_date);
			
			_vbox.appendChild(_p_res);
			_vbox.appendChild(_p);
			
			
			if(_jsonData[i].photo_url){
				
				var _photo_img = this.createImgElm(_jsonData[i].photo_url);
				_photo_img.setAttribute("class", "user_photo");
				_photo_img.setAttribute("photosrc", _jsonData[i].photo_url);
				_photo_img.setAttribute("onclick", "wass.openURI(this.getAttribute('photosrc'));");

				var _p_photoImg = document.createElementNS(XHTMLNS, 'p');
				_p_photoImg.setAttribute("class", "user_photo");
				_p_photoImg.appendChild(_photo_img);
				_vbox.appendChild(_p_photoImg);
			}
			
			
			if(_favs = this.makeFavoritesIcon(_jsonData[i].favorites)){
				_vbox.appendChild(_favs);
			}
			

		
			_hbox.appendChild(_my_vbox);
			_hbox.appendChild(_vbox);
			_wassContentArea.appendChild(_hbox);
				
			//Application.console.log(_jsonData[i].html);
		}
		
		
	},
	
	getOwnerData: function(e){
	
		if(this._username && this._password){
			// var xmlURL_self = 'http://api.wassr.jp/statuses/friends_timeline.json?id=' + this._username;
			// var req = new XMLHttpRequest();
			// req.open("GET", xmlURL_self, true);
			// req.send(null);
			
			var xmlURL_self = 'http://api.wassr.jp/statuses/user_timeline.json';
			var req = new XMLHttpRequest();
			req.open("POST",xmlURL_self,true);
			req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
			req.setRequestHeader("Authorization" , "Basic " + this._basic);
			req.setRequestHeader("User-Agent" , "FireWassr");
			
			// req.send("id="+this._username); 
			req.send(null); 
			
		}
		
		req.onreadystatechange = function(){
			Application.console.log(req.responseText);
			if(req.readyState==4 && req.status==200){
				wass.onGetOwnerData(req.responseText);
			}else if(req.readyState==4 && req.status > 200){
				alert("error. ID or Passが違うかネットワークエラーかな");
			}
		} 
	},
  
	onGetOwnerData: function(data){
	
			Application.console.log(data);
			var _jsonData = JSON.parse(data);
			
			var _wassContentArea = this.$("wass_content_owner");
			_wassContentArea.textContent = "";
				
			for(var i=0; i<_jsonData.length; i++){
			
				var _hbox = document.createElement("hbox");
				_hbox.setAttribute("class", "comment_box");
				
				//フォロワ？
				var Re = new RegExp(_jsonData[i].user_login_id, "i");
				if(this.Followers.search(Re) >= 0){
					_hbox.setAttribute("class", "comment_box_follow");
				}
				
				
				var _vbox = document.createElement("vbox"); //右
				_vbox.setAttribute("class", "right");
				
				
				var _img = this.createImgElm(_jsonData[i].user.profile_image_url);
				
				_img.setAttribute("width", "32");
				_img.setAttribute("height", "32");
				_img.setAttribute("class", "user_img");
				_img.setAttribute("tooltiptext", _jsonData[i].user.screen_name);
				
				var _a = document.createElementNS(XHTMLNS, 'a');
	      		_a.setAttribute("href", _jsonData[i].link);
	      		_a.setAttribute("class", "user_img");
				_a.setAttribute("onclick", 'return wass.openURI(this.href);');
				_a.appendChild(_img);
				
				var _p_res = document.createElementNS(XHTMLNS, 'p');
				_p_res.setAttribute("class", "restxt");
				if(_jsonData[i].reply_message){
				
					var _rep = _jsonData[i].reply_message.replace(/>/g, "&gt;");
					_rep = _rep.replace(/</g, "&lt;")

					var _res = ' > ' + _rep + 'by ' +  _jsonData[i].reply_user_nick + "\n";
					_p_res.innerHTML=_res;
				}

				var _my_vbox = document.createElement("vbox");
				_my_vbox.setAttribute("class", "left");
				_my_vbox.appendChild(_a);
				
				var _img_iine = document.createElement("image");
				_img_iine.setAttribute("class", "fav_button");
				_img_iine.setAttribute("tooltiptext", "イイネ!");
				_img_iine.setAttribute("rid", _jsonData[i].rid);
				
				if(this.checkIine(_jsonData[i].favorites)){
					_img_iine.setAttribute("fav", "done");
				}
				
				_img_iine.setAttribute("onclick", "wass.sendIine(this);");
				_my_vbox.appendChild(_img_iine);
				
				var _p = document.createElementNS(XHTMLNS, 'p');
				//_p.innerHTML=_jsonData[i].html;
				_p.appendChild(this.textToEmoji(_jsonData[i].html));
				
				
				var _resanch = document.createElementNS(XHTMLNS, 'a');
	      		_resanch.setAttribute("title", _jsonData[i].user.screen_name);
	      		_resanch.setAttribute("rel", _jsonData[i].rid);
	      		_resanch.setAttribute("class", "res_anch");
				_resanch.setAttribute("onclick", 'wass.resModeOn(this.rel, this.title);');
				_resanch.innerHTML = " レス";
				_p.appendChild(_resanch);
				
				
				var _date = document.createElementNS(XHTMLNS, 'p');
				_date.setAttribute("class", "date");
				var _dateObj = new Date(_jsonData[i].epoch*1000);
				_date.innerHTML = _dateObj.toLocaleString();
				_p.appendChild(_date);
					
				
				
				_vbox.appendChild(_p_res);
				_vbox.appendChild(_p);
				
				
				if(_jsonData[i].photo_thumbnail_url){
					
					var _photo_img = this.createImgElm(_jsonData[i].photo_thumbnail_url);
					_photo_img.setAttribute("class", "user_photo");
					_photo_img.setAttribute("photosrc", _jsonData[i].photo_url);
					_photo_img.setAttribute("onclick", "wass.openURI(this.getAttribute('photosrc'));");
					
					var _p_photoImg = document.createElementNS(XHTMLNS, 'p');
					_p_photoImg.setAttribute("class", "user_photo");
					_p_photoImg.appendChild(_photo_img);
					_vbox.appendChild(_p_photoImg);
					
				}
				
				
				if(_favs = this.makeFavoritesIcon(_jsonData[i].favorites)){
					_vbox.appendChild(_favs);
				}
				

			
				_hbox.appendChild(_my_vbox);
				_hbox.appendChild(_vbox);
				_wassContentArea.appendChild(_hbox);
				
							
				//Application.console.log();
			}
			

			
	},

	
	getResData: function(e){
	
		if(this._username && this._password){
			// var xmlURL_self = 'http://api.wassr.jp/statuses/friends_timeline.json?id=' + this._username;
			// var req = new XMLHttpRequest();
			// req.open("GET", xmlURL_self, true);
			// req.send(null);
			
			var xmlURL_self = 'http://api.wassr.jp/statuses/replies.json';
			var req = new XMLHttpRequest();
			req.open("POST",xmlURL_self,true);
			req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
			req.setRequestHeader("Authorization" , "Basic " + this._basic);
			req.setRequestHeader("User-Agent" , "FireWassr");
			
			// req.send("id="+this._username); 
			req.send(null); 
			
		}
		
		req.onreadystatechange = function(){
			Application.console.log(req.responseText);
			if(req.readyState==4 && req.status==200){
				wass.onGetResData(req.responseText);
			}else if(req.readyState==4 && req.status > 200){
				alert("error. ID or Passが違うかネットワークエラーかな");
			}
		} 
	},
  
	onGetResData: function(data){
	
			Application.console.log(data);
			var _jsonData = JSON.parse(data);
			
			var _wassContentArea = this.$("wass_content_res");
			_wassContentArea.textContent = "";
				
			for(var i=0; i<_jsonData.length; i++){
			
				var _hbox = document.createElement("hbox");
				_hbox.setAttribute("class", "comment_box");
				
				//フォロワ？
				var Re = new RegExp(_jsonData[i].user_login_id, "i");
				if(this.Followers.search(Re) >= 0){
					_hbox.setAttribute("class", "comment_box_follow");
				}
				
				
				var _vbox = document.createElement("vbox"); //右
				_vbox.setAttribute("class", "right");
				
				
				var _img = this.createImgElm(_jsonData[i].user.profile_image_url);
				
				_img.setAttribute("width", "32");
				_img.setAttribute("height", "32");
				_img.setAttribute("class", "user_img");
				_img.setAttribute("tooltiptext", _jsonData[i].user.screen_name);
				
				var _a = document.createElementNS(XHTMLNS, 'a');
	      		_a.setAttribute("href", _jsonData[i].link);
	      		_a.setAttribute("class", "user_img");
				_a.setAttribute("onclick", 'return wass.openURI(this.href);');
				_a.appendChild(_img);
				
				var _p_res = document.createElementNS(XHTMLNS, 'p');
				_p_res.setAttribute("class", "restxt");
				if(_jsonData[i].reply_message){
				
					var _rep = _jsonData[i].reply_message.replace(/>/g, "&gt;");
					_rep = _rep.replace(/</g, "&lt;")

					var _res = ' > ' + _rep + 'by ' +  _jsonData[i].reply_user_nick + "\n";
					_p_res.innerHTML=_res;
				}

				var _my_vbox = document.createElement("vbox");
				_my_vbox.setAttribute("class", "left");
				_my_vbox.appendChild(_a);
				
				var _img_iine = document.createElement("image");
				_img_iine.setAttribute("class", "fav_button");
				_img_iine.setAttribute("tooltiptext", "イイネ!");
				_img_iine.setAttribute("rid", _jsonData[i].rid);
				
				if(this.checkIine(_jsonData[i].favorites)){
					_img_iine.setAttribute("fav", "done");
				}
				
				_img_iine.setAttribute("onclick", "wass.sendIine(this);");
				_my_vbox.appendChild(_img_iine);
				
				var _p = document.createElementNS(XHTMLNS, 'p');
				//_p.innerHTML=_jsonData[i].html;
				_p.appendChild(this.textToEmoji(_jsonData[i].html));
				
				
				var _resanch = document.createElementNS(XHTMLNS, 'a');
	      		_resanch.setAttribute("title", _jsonData[i].user.screen_name);
	      		_resanch.setAttribute("rel", _jsonData[i].rid);
	      		_resanch.setAttribute("class", "res_anch");
				_resanch.setAttribute("onclick", 'wass.resModeOn(this.rel, this.title);');
				_resanch.innerHTML = " レス";
				_p.appendChild(_resanch);
				
				
				var _date = document.createElementNS(XHTMLNS, 'p');
				_date.setAttribute("class", "date");
				var _dateObj = new Date(_jsonData[i].epoch*1000);
				_date.innerHTML = _dateObj.toLocaleString();
				_p.appendChild(_date);
					
				
				
				_vbox.appendChild(_p_res);
				_vbox.appendChild(_p);
				
				
				if(_jsonData[i].photo_thumbnail_url){
					
					var _photo_img = this.createImgElm(_jsonData[i].photo_thumbnail_url);
					_photo_img.setAttribute("class", "user_photo");
					_photo_img.setAttribute("photosrc", _jsonData[i].photo_url);
					_photo_img.setAttribute("onclick", "wass.openURI(this.getAttribute('photosrc'));");
					
					var _p_photoImg = document.createElementNS(XHTMLNS, 'p');
					_p_photoImg.setAttribute("class", "user_photo");
					_p_photoImg.appendChild(_photo_img);
					_vbox.appendChild(_p_photoImg);
					
				}
				
				
				if(_favs = this.makeFavoritesIcon(_jsonData[i].favorites)){
					_vbox.appendChild(_favs);
				}
				

			
				_hbox.appendChild(_my_vbox);
				_hbox.appendChild(_vbox);
				_wassContentArea.appendChild(_hbox);
				
							
				//Application.console.log();
			}
			

			
	},

	getPublicData: function(e){
	
		// if(this._username && this._password){
			// var xmlURL_self = 'http://api.wassr.jp/statuses/friends_timeline.json?id=' + this._username;
			// var req = new XMLHttpRequest();
			// req.open("GET", xmlURL_self, true);
			// req.send(null);
			
			var xmlURL_self = 'http://api.wassr.jp/statuses/public_timeline.json';
			var req = new XMLHttpRequest();
			req.open("GET",xmlURL_self,true);
			req.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded;charset=UTF-8");
			// req.setRequestHeader("Authorization" , "Basic " + this._basic);
			// req.setRequestHeader("User-Agent" , "FireWassr");
			
			// req.send("id="+this._username); 
			req.send(null); 
			
		// }
		
		req.onreadystatechange = function(){
			Application.console.log(req.responseText);
			if(req.readyState==4 && req.status==200){
				wass.onGetPublicData(req.responseText);
			}else if(req.readyState==4 && req.status > 200){
				alert("error. ID or Passが違うかネットワークエラーかな");
			}
		} 
	},
  
	onGetPublicData: function(data){
	
			Application.console.log(data);
			var _jsonData = JSON.parse(data);
			Application.console.log(_jsonData);
			var _wassContentArea = this.$("wass_content_public");
			_wassContentArea.textContent = "";
				
			for(var i=0; i<_jsonData.length; i++){
			
				var _hbox = document.createElement("hbox");
				_hbox.setAttribute("class", "comment_box");
				
				//フォロワ？
				var Re = new RegExp(_jsonData[i].user_login_id, "i");
				if(this.Followers.search(Re) >= 0){
					_hbox.setAttribute("class", "comment_box_follow");
				}
				
				
				var _vbox = document.createElement("vbox"); //右
				_vbox.setAttribute("class", "right");
				
				
				var _img = this.createImgElm(_jsonData[i].user.profile_image_url);
				
				_img.setAttribute("width", "32");
				_img.setAttribute("height", "32");
				_img.setAttribute("class", "user_img");
				_img.setAttribute("tooltiptext", _jsonData[i].user.screen_name);
				
				var _a = document.createElementNS(XHTMLNS, 'a');
	      		_a.setAttribute("href", _jsonData[i].link);
	      		_a.setAttribute("class", "user_img");
				_a.setAttribute("onclick", 'return wass.openURI(this.href);');
				_a.appendChild(_img);
				
				var _p_res = document.createElementNS(XHTMLNS, 'p');
				_p_res.setAttribute("class", "restxt");
				if(_jsonData[i].reply_message){
				
					var _rep = _jsonData[i].reply_message.replace(/>/g, "&gt;");
					_rep = _rep.replace(/</g, "&lt;")

					var _res = ' > ' + _rep + 'by ' +  _jsonData[i].reply_user_nick + "\n";
					_p_res.innerHTML=_res;
				}

				var _my_vbox = document.createElement("vbox");
				_my_vbox.setAttribute("class", "left");
				_my_vbox.appendChild(_a);
				
				var _img_iine = document.createElement("image");
				_img_iine.setAttribute("class", "fav_button");
				_img_iine.setAttribute("tooltiptext", "イイネ!");
				_img_iine.setAttribute("rid", _jsonData[i].rid);
				
				if(this.checkIine(_jsonData[i].favorites)){
					_img_iine.setAttribute("fav", "done");
				}
				
				_img_iine.setAttribute("onclick", "wass.sendIine(this);");
				_my_vbox.appendChild(_img_iine);
				
				var _p = document.createElementNS(XHTMLNS, 'p');
				//_p.innerHTML=_jsonData[i].html;
				_p.appendChild(this.textToEmoji(_jsonData[i].html));
				
				
				var _resanch = document.createElementNS(XHTMLNS, 'a');
	      		_resanch.setAttribute("title", _jsonData[i].user.screen_name);
	      		_resanch.setAttribute("rel", _jsonData[i].rid);
	      		_resanch.setAttribute("class", "res_anch");
				_resanch.setAttribute("onclick", 'wass.resModeOn(this.rel, this.title);');
				_resanch.innerHTML = " レス";
				_p.appendChild(_resanch);
				
				
				var _date = document.createElementNS(XHTMLNS, 'p');
				_date.setAttribute("class", "date");
				var _dateObj = new Date(_jsonData[i].epoch*1000);
				_date.innerHTML = _dateObj.toLocaleString();
				_p.appendChild(_date);
					
				
				
				_vbox.appendChild(_p_res);
				_vbox.appendChild(_p);
				
				
				if(_jsonData[i].photo_thumbnail_url){
					
					var _photo_img = this.createImgElm(_jsonData[i].photo_thumbnail_url);
					_photo_img.setAttribute("class", "user_photo");
					_photo_img.setAttribute("photosrc", _jsonData[i].photo_url);
					_photo_img.setAttribute("onclick", "wass.openURI(this.getAttribute('photosrc'));");
					
					var _p_photoImg = document.createElementNS(XHTMLNS, 'p');
					_p_photoImg.setAttribute("class", "user_photo");
					_p_photoImg.appendChild(_photo_img);
					_vbox.appendChild(_p_photoImg);
					
				}
				
				
				if(_favs = this.makeFavoritesIcon(_jsonData[i].favorites)){
					_vbox.appendChild(_favs);
				}
				

			
				_hbox.appendChild(_my_vbox);
				_hbox.appendChild(_vbox);
				_wassContentArea.appendChild(_hbox);
				
							
				//Application.console.log();
			}
			

			
	},

	
	
	tabChanged: function(tab_id){
	
		if(tab_id === 0){
			this.getData();
		}else if(tab_id === 1){
			this.getChannels();
			this.getChannelsData();
		}else if(tab_id === 2){
			this.getOwnerData();
		}else if(tab_id === 3){
			this.getResData();
		}else if(tab_id === 4){
			this.getPublicData();
		}
	},
	
	
	textToEmoji: function(_data){
	
		var myRe=/<img class="emoji" src="(.*?)" alt=".*?" title=".*?" width="16" height="16" \/>/g;
		var _d = _data.split(myRe);
		
		var _description = document.createElement("description");
	
		if(_d){
			for(var j=0; j<_d.length; j++){
				if(_d[j].indexOf('http://wassr.jp/img/') == -1){
					//_description.appendChild(document.createTextNode(_d[j]));
					_description.appendChild(this.makeTextLink(_d[j]));

				}else{
					var _tmp_img = document.createElement("image");
					_tmp_img.setAttribute("src", _d[j]);
					_description.appendChild(_tmp_img);
				}
			}
		}
		
		return _description;
	
	},
	
	makeTextLink: function(_txt){
		
		var myRe = /http(s?)\:\/\/([0-9a-zA-Z\-]+\.)+[a-zA-Z]{2,6}(\:[0-9]+)?(\/([\w#!:.?+=&%@~*\';,\-\/\$])*)?/;
		var _description = document.createElement("description");
		
		if (myArray = myRe.exec(_txt)) {
			_d = _txt.split(myArray[0]);
			
			var _span = document.createElementNS(XHTMLNS, 'span');
			_span.innerHTML = _d[0];
			_description.appendChild(_span);
			var _a = document.createElementNS(XHTMLNS, 'a');
			_a.setAttribute("href", myArray[0]);
			_a.setAttribute("onclick", 'return wass.openURI(this.href);');
			_a.innerHTML = myArray[0];
			_description.appendChild(_a);
			
			if(_d[1]){
				_description.appendChild(this.makeTextLink(_d[1]));
			}
			
			return _description;
			
		}else{
			var _span = document.createElementNS(XHTMLNS, 'span');
			_span.innerHTML = _txt;
			return _description.appendChild(_span);
		}
		
	},
	
	makeFavoritesIcon: function(_arr){
	
		if(_arr.length){
		
			var _p = document.createElementNS(XHTMLNS, 'p');
			_p.setAttribute("class", "favs");
			var _user_uri = 'http://wassr.jp/user/';
			var _icon_uri_tmp = '/profile_img.png.16.1244089823';
			
			for(var i=0; i<_arr.length; i++){
			
				var _a = document.createElementNS(XHTMLNS, 'a');
	      		_a.setAttribute("href", _user_uri + _arr[i]);
				_a.setAttribute("onclick", 'return wass.openURI(this.href);');
				_a.appendChild(this.createImgElm(_user_uri + _arr[i] + _icon_uri_tmp));
				_p.appendChild(_a);
			
			}
			
			return _p;
			
		}
	
	},
	
	resModeOn: function(_rid, _title){

		this.$("wass_input").setAttribute("class", "resMode");
		this.$("wass_resname").setAttribute("title", _rid);
    	//
		this.$("wass_resname").style.backgroundColor = "#fcfcfc";
		this.$("wass_resname").style.margin = "3px";
		this.$("wass_resname").style.height = "atuo";
    	if(this.$("wass_resname").firstChild){
    		this.$("wass_resname").removeChild(this.$("wass_resname").firstChild);
    	}
    	var _a = document.createElementNS(XHTMLNS, 'a');
		_a.setAttribute("onclick", 'wass.resModeOff();');
		_a.innerHTML = "&gt; " + _title;
		this.$("wass_resname").appendChild(_a);
    	
    	return false;
	},
	
	resModeOff: function(){

		this.$("wass_input").setAttribute("class", "");
		this.$("wass_resname").setAttribute("title", "");

    	//
		this.$("wass_resname").style.backgroundColor = "none";
		this.$("wass_resname").style.margin = "0";
		this.$("wass_resname").style.height = "atuo";
    	
		if(this.$("wass_resname").firstChild){
    		this.$("wass_resname").removeChild(this.$("wass_resname").firstChild);
    	}
    	
    	return false;
	},
	
	resModeChannelOn: function(_rid, _title){

		this.$("wass_input_channel").setAttribute("class", "resMode");
		this.$("wass_resname_channel").setAttribute("title", _rid);
    	//
		this.$("wass_resname_channel").style.backgroundColor = "#fcfcfc";
		this.$("wass_resname_channel").style.margin = "3px";
		this.$("wass_resname_channel").style.height = "atuo";
    	if(this.$("wass_resname_channel").firstChild){
    		this.$("wass_resname_channel").removeChild(this.$("wass_resname_channel").firstChild);
    	}
    	var _a = document.createElementNS(XHTMLNS, 'a');
		_a.setAttribute("onclick", 'wass.resModeChannelOff();');
		_a.innerHTML = "&gt; " + _title;
		this.$("wass_resname_channel").appendChild(_a);
    	
    	return false;
	},
	
	resModeChannelOff: function(){

		this.$("wass_input_channel").setAttribute("class", "");
		this.$("wass_resname_channel").setAttribute("title", "");

    	//
		this.$("wass_resname_channel").style.backgroundColor = "none";
		this.$("wass_resname_channel").style.margin = "0";
		this.$("wass_resname_channel").style.height = "atuo";
    	
		if(this.$("wass_resname_channel").firstChild){
    		this.$("wass_resname_channel").removeChild(this.$("wass_resname_channel").firstChild);
    	}
    	
    	return false;
	},
	
	openURI: function(uri){
		var tab = gBrowser.addTab(uri, null, null);
    	gBrowser.selectedTab = tab;
    	
    	this._panel.hidePopup(); 
    	this.isOpen = false;
    	
    	return false;
	},
	
	fileSelect: function(){
	
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select a File", nsIFilePicker.modeOpen);
		fp.appendFilter("Image Files","*.jpeg; *.jpe; *.jpg; *.png");
		
		var res = fp.show();
		if (res == nsIFilePicker.returnOK){
			this.$("wass_file_channel").file = fp.file;
			this.$("wass_file_channel").label = fp.file.path;

		  //btoa
			
			alert(fp.file.leafName);
			alert(fp.file.path);
			alert(fp.file.fileSize);
		}

	},
	
	setPref: function(){
	
		// window.openDialog("chrome://my/content/prefs.xul", 'Preferences', 'chrome,titlebar,toolbar,centerscreen,modal');
		this._username=this.getPref("username", "wass.");
		this._password=this.getPref("password", "wass.");
		this._updatetime=this.getPref("updatetime", "wass.");
		if(this._updatetime==""){
			this._updatetime = 15;
		}
	
	},
	
	
	/**
	 * Preference情報を取得します（設定の情報）
	 * @param prefstring	取得するキー
	 * @param domain		ドメイン
	 */
	getPref: function(prefstring, domain) {
		// 設定の情報を取得するXPCOMオブジェクトの生成
		var prefSvc = Components.classes["@mozilla.org/preferences-service;1"]
							.getService(Components.interfaces.nsIPrefService);
		var prefBranch = prefSvc.getBranch(domain);
		var type = prefBranch.getPrefType(prefstring);
		var nsIPrefBranch = Components.interfaces.nsIPrefBranch;
		
		// タイプ別に取得する関数を分ける
		switch (type) {
			case nsIPrefBranch.PREF_STRING:
				return prefBranch.getCharPref(prefstring);
				break;
			case nsIPrefBranch.PREF_INT:
				return prefBranch.getIntPref(prefstring);
				break;
			case nsIPrefBranch.PREF_BOOL:
				return prefBranch.getBoolPref(prefstring);
				break;
		 }
	 }
  
};
function wass(){}
var wass = new wass();
window.addEventListener("load", function(e) { wass.load(e); }, false);

//for ver.3.5less
//Components.utils.import("resource://gre/modules/JSON.jsm");



