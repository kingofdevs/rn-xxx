import React, { Component } from 'react'
import ReactNative, { StatusBar, InteractionManager,Dimensions, Linking } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from 'react-redux'
import { NavigationActions } from 'react-navigation'
import { bindActionCreators } from 'redux' 
import { ActionCreators } from '../actions/index'
import Modal from "react-native-modal"

import { GoogleAnalyticsTracker, GoogleTagManager, GoogleAnalyticsSettings } from "react-native-google-analytics-bridge";

import Styles from '../libs/style/style'
import pin from '../libs/style/pin'
import globalVals from '../libs/global';

import Loader from '../components/loader';
import NoRecords from '../components/noRecords';
import Popup from '../components/Popup';
import BackButton from '../components/backButton';

import images from '../assets/imgLibrary';

var _ = require('lodash');
import Moment from 'moment'

import Icon from 'react-native-vector-icons/Feather';

const {
    ScrollView,
    View,
    Text,
    TextInput,
    Image,
    TouchableHighlight,
    ToastAndroid,
    Alert,
    TouchableNativeFeedback,
    Button,
    StyleSheet
} = ReactNative

class Pin extends Component {

    constructor(props) {
        super(props)
        this.state = { loadingData: false, pin1:"",pin2:"",pin3:"",pin4:"", type:"", popup:{
            status:false,
            icon:'',
            title:'',
            message:'',
        } };
        this.params = this.props.navigation.state;

        this.pin1="";
        this.pin2="";
        this.pin3="";
        this.pin4="";
    }
    
    _handleBack = () => {
        this.props.navigation.dispatch(NavigationActions.back({}));
    }

    componentDidMount(){ 

        this.props.navigation.setParams({
            onBackPress: this._handleBack 
        });
       
        // this.setState({"type":this.params.params.q});
    }

    updatePin(val){

        if(val>=0){

            if(this.state.pin1==""){
                this.setState({pin1:val});
                this.pin1=val;
            }else if(this.state.pin2==""){
                this.setState({pin2:val});
                this.pin2=val;
            }else if(this.state.pin3==""){
                this.setState({pin3:val});
                this.pin3=val;
            }else if(this.state.pin4==""){
                this.setState({pin4:val});
                this.pin4=val;
            }

        }else if(val==-1) {
            if(this.state.pin4!=""){
                this.setState({pin4:""});
                this.pin4="";
            }else if(this.state.pin3!=""){
                this.setState({pin3:""});
                this.pin3="";
            }else if(this.state.pin2!=""){
                this.setState({pin2:""});
                this.pin2="";
            }else if(this.state.pin1!=""){
                this.setState({pin1:""});
                this.pin1="";
            }
        }

        console.log(this.pin1 + "" + this.pin2 + "" + this.pin3 + "" + this.pin4);
        let finalPin = this.pin1 + "" + this.pin2 + "" + this.pin3 + "" + this.pin4;
        if(finalPin.length==4){
            

            this.setState({loadingData:true});

            console.log(globalVals.userNumber);

            this.props.basicAuth(globalVals.userNumber, finalPin).then((resp)=>{
                console.log(resp);
                if(resp.response.messageType=="SUCCESS"){
                    globalVals.user.token = resp.response.message;
                    globalVals.user.mobile = globalVals.userNumber;
                    
                    AsyncStorage.setItem("userData", JSON.stringify(globalVals.user));

                    var queryParams = "clientId="+ globalVals.clientId +"&channel="+ globalVals.channel +"&appVersion="+ globalVals.appVersion +"&advertisingId="+ globalVals.advertisingId +"&eventType=LOGIN";

                    this.props.postLogEvent(globalVals.user.token,queryParams).then((log)=>{

                    });

                    if(this.params.params.q==1 || this.params.params.q==2 || this.params.params.q==5){

                        console.log("getting profile");
                        // DO Get Profile
                        this.props.getProfile(resp.response.message).then((profile)=>{

                            console.log("pin profile -------- ");
                            console.log(profile);
                            console.log("-------- ");

                            this.setState({loadingData:false});

                            globalVals.user.status = profile.response.userSubscriptionStatus;
                            globalVals.user.image = profile.response.userPhotoUrl;

                            this.props.navigation.dispatch(NavigationActions.navigate({routeName:'MainPage'}));
                        });

                        if(this.params.params.q==1 || this.params.params.q==5){
                            // DO Subscribe user
                            this.props.subscribeUser(resp.response.message).then((subscribe)=>{
                                console.log("Subscription response:");
                                console.log(subscribe);

                            });
                        }

                    }else if(this.params.params.q==4){
                        // Do Topup Credits

                        this.props.topupCredits(globalVals.user.token,this.params.params.p).then((resp)=>{
                            console.log(resp);
                            this.setState({loadingData:false});
                            if(resp.response.messageType=="Success"){
                                this.setState({popup:{
                                    status:true,
                                    icon:images.success,
                                    title:'Thank You!',
                                    message:'An SMS will be sent to you once the charge has been processed successfully'
                                }})
                            }else {

                                var displayMsg = resp.response.message;

                                if(displayMsg == "LAST TOPUP REQUEST IN PENDING STATUS"){
                                    displayMsg = "Cannot process your request. Your last topup request is in queue.";
                                }

                                this.setState({popup:{
                                    status:true,
                                    icon:images.error,
                                    title:'Error',
                                    message:displayMsg,
                                }})
                            }

                        });


                    }else if(this.params.params.q==6){
                        // Do unsubscribe
                        this.props.unsubscribeUser(globalVals.user.token).then((unsub)=>{
                            this.setState({loadingData:false});
                            if(unsub.status==200){
                                
                                this.props.getProfile(globalVals.user.token).then((profile)=>{
                                    
                                    console.log(profile);
                                    
                                    globalVals.user.status = profile.response.userSubscriptionStatus;
                                    globalVals.user.image = profile.response.userPhotoUrl;

                                    this.setState({loadingData:false});

                                    this.setState({popup:{
                                        status:true,
                                        icon:images.success,
                                        title:'Success',
                                        message:'Your request to UNSIBSCIRBE has been received successfully.'
                                    }})
                                });


                            }else {
                                this.setState({loadingData:false});
                                this.setState({popup:{
                                    status:true,
                                    icon:images.error,
                                    title:'Error',
                                    message:'Error occured while processing your request. Please try again later.'
                                }})
                            }

                        });
                    }
                    
                }else {
                    this.setState({loadingData:false});
                    console.log(resp);
                    this.setState({popup:{
                        status:true,
                        icon:images.error,
                        title:'Error',
                        message:'Invalid Pin Code.'
                    }})
                }

            });
        }
        
    }

    closePopup(){
        this.setState({
            popup:{
                status:false,
                title:'',
                message:'',
                icon:images.success,
            }
        })

        if(this.params.params.q==6){
            this.props.navigation.dispatch(NavigationActions.navigate({routeName:'Home'}));
        }
        if(this.params.params.q==4){
            this.props.navigation.dispatch(NavigationActions.navigate({routeName:'Profile'}));
        }
    }

    resendSMS () {

        Alert.alert('Resend SMS','Are you sure you want to receive an activation code again?',[
            {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
            {text: 'OK', onPress: () => {this.processSMS()}},
          ],);
    }

    processSMS(){
        this.setState({loadingData:true});
        this.props.registerUser(globalVals.userNumber).then((resp)=>{
            console.log(resp);

            if(resp.status==200){

                ToastAndroid.show('Activation code has been sent.',ToastAndroid.SHORT);
                this.setState({loadingData:false});
            }else {
                this.setState({loadingData:false});
                this.setState({
                    popup:{
                        status:true,
                        icon:images.error,
                        title:'Error',
                        message:'Error occured while processing your request. Please try again later.'
                    }
                })

            }
            
        });
    }
    

    render(){

        return <View style={Styles.containerNoPadding}>
                <StatusBar translucent backgroundColor="rgba(0, 0, 0, 0)"/>

                <View style={pin.wrapper}>
                   { this.params.params.q==1 ? <View style={pin.top}>
                            <Text style={pin.title}>Almost Done.</Text>
                            <Text style={pin.textSmall}>Please enter PIN sent to </Text>
                            <Text style={pin.number}>{globalVals.userNumber}</Text>
                            <Text style={pin.textSmall}>This can take upto a minute. </Text>
                    </View> : <View style={pin.top}>
                            
                            <Text style={pin.title}>{"\n\n\n"}Enter your 4 digit PIN.</Text>

                    </View> }
                    <View style={pin.pinBox}>
                        <View style={pin.pin}>{ this.pin1!='' ? <View style={pin.bullet}></View> : null }</View>
                        <View style={pin.pin}>{ this.pin2!='' ? <View style={pin.bullet}></View> : null }</View>
                        <View style={pin.pin}>{ this.pin3!='' ? <View style={pin.bullet}></View> : null }</View>
                        <View style={pin.pin}>{ this.pin4!='' ? <View style={pin.bullet}></View> : null }</View>
                    </View>
                    { this.params.params.q==1 ?<TouchableHighlight onPress={ ()=> this.resendSMS()} underlayColor={globalVals.colors.white}><Text style={pin.text}>No SMS? Click Here</Text></TouchableHighlight> : null }
                    <View style={pin.keypad}>
                        <View style={pin.keypadrow}>
                            <TouchableHighlight onPress={ ()=> this.updatePin('1')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>1</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('2')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>2</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('3')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>3</Text></TouchableHighlight>
                        </View>
                        <View style={pin.keypadrow}>
                            <TouchableHighlight onPress={ ()=> this.updatePin('4')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>4</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('5')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>5</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('6')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>6</Text></TouchableHighlight>
                        </View>
                        <View style={pin.keypadrow}>
                            <TouchableHighlight onPress={ ()=> this.updatePin('7')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>7</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('8')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>8</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('9')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>9</Text></TouchableHighlight>
                        </View>
                        <View style={pin.keypadrow}>
                            <TouchableHighlight style={[pin.key, pin.noBorder]}><Text style={pin.keyLbl}></Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('0')} style={pin.key} underlayColor={globalVals.colors.white} ><Text style={pin.keyLbl}>0</Text></TouchableHighlight>
                            <TouchableHighlight onPress={ ()=> this.updatePin('-1')} style={[pin.key, pin.noBorder]} underlayColor={globalVals.colors.white}><Image source={images.backspace} style={pin.backspace}/></TouchableHighlight>
                        </View>
                        
                        
                    </View>
                </View>

                { this.state.loadingData==true ? <Loader label="Loading..." /> : null }

                <Modal isVisible={this.state.popup.status}
                    onBackdropPress={() => this.closePopup() }
                    onBackButtonPress={() => this.closePopup() }
                    backdropTransitionInTiming={0}
                    backdropTransitionOutTiming={0}
                    useNativeDriver={true}
                    animationIn={'fadeIn'}
                    animationOut={'fadeOut'}
                    hideModalContentWhileAnimating={true}

                ><Popup icon={this.state.popup.icon} title={this.state.popup.title} message={ this.state.popup.message} onPress={ ()=> { this.closePopup() }} /></Modal>

        </View>
    }

    static navigationOptions = ({ navigation, screenProps }) => {
    const { params } = navigation.state;
        return {
            title: "PIN",
            headerLeft: <BackButton onPress={ ()=> { params.onBackPress() } } />,
        }
    };

}

function mapStateToProps(state){
    console.log(state);
    return {
        // statistics: state.Statistics.statistics.response,
        // categories: state.Deals.categories
        general:state.general.general
    }

}

function mapDispatchToProps (dispatch){
    return bindActionCreators(ActionCreators,dispatch);
    // return {
    //     actions: dispatch(ActionCreators,dispatch)
    //     // getStatistics: dispatch(ActionCreators.getStatistics(),dispatch) 
    // }
}

export default connect (mapStateToProps,mapDispatchToProps)(Pin);