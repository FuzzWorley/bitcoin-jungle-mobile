import DateTimePicker from "@react-native-community/datetimepicker"
import auth from "@react-native-firebase/auth"
import functions from "@react-native-firebase/functions"
import { useNavigation, useRoute } from "@react-navigation/native"
import { inject } from "mobx-react"
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Alert, StyleSheet, Text, TextInput, View } from "react-native"
import { Button, Input } from "react-native-elements"
import Icon from "react-native-vector-icons/Ionicons"
import { Onboarding } from "types"
import { OnboardingScreen } from "../../components/onboarding"
import { Screen } from "../../components/screen"
import { translate } from "../../i18n"
import { color } from "../../theme"
import { palette } from "../../theme/palette"
import { emailIsValid } from "../../utils/helper"
import HoneyBadgerShovel from "../welcome-screens/honey-badger-shovel-01.svg"
import { CloseCross } from "../../components/close-cross"


const bankLogo = require("./BankLogo.png")
const popcornLogo = require("../rewards-screen/PopcornLogo.png")

const styles = StyleSheet.create({
  buttonContainer: {
    paddingBottom: 40,
    paddingHorizontal: 80,
    paddingTop: 20,
  },

  buttonStyle: {
    backgroundColor: color.primary,
    borderRadius: 32,
  },

  text: {
    fontSize: 18,
    paddingHorizontal: 40,
    paddingTop: 100,
    textAlign: "center",
  },

  argumentText: {
    fontSize: 18,
    paddingHorizontal: 40,
    textAlign: "left",
  },

  textInfos: {
    fontSize: 18,
    paddingHorizontal: 40,
    paddingVertical: 20,
    textAlign: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 20,
    textAlign: "center",
  },
})

const Argument = ({text}) => (
  <View style={{flexDirection: "row", paddingBottom: 20, paddingHorizontal: 20}}>
    <Icon
      name={"logo-bitcoin"}
      size={32}
      color={palette.darkGrey}
    />
    <Text style={styles.argumentText}>{text}</Text>
  </View>
)

export const BankAccountRewardsScreen = ({ navigation }) => {
  
  return (
    <Screen preset="scroll">
      <View style={{margin: 24, backgroundColor: palette.white, borderRadius: 32}}>
        <View style={{alignSelf: "center", marginTop: 24}}>
          <HoneyBadgerShovel />
        </View>
        <Text style={styles.title}>{translate("BankAccountRewardsScreen.openAccount")}</Text>
        <Argument text={translate("BankAccountRewardsScreen.holdUSDollar")} />
        <Argument text={translate("BankAccountRewardsScreen.debitCard")} />
        <Argument text={translate("BankAccountRewardsScreen.buySell")} />
        <View style={{ flex: 1 }} />
        <Button
          title="Join waiting list"
          type="solid"
          onPress={() => navigation.navigate("openBankAccount")}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.buttonStyle}
          titleStyle={{fontWeight: "bold"}}
        />
      <CloseCross color={palette.darkGrey} navigation={navigation} />
      </View>
    </Screen>
  )
}

export const OpenBankScreen = ({ navigation }) => {
  return (
    <Screen>
      <OnboardingScreen
        image={bankLogo}
        action={() => {
          auth().currentUser?.isAnonymous
            ? navigation.navigate("welcomePhoneInputBanking") // FIXME should be welcomePhoneInput
            : navigation.navigate("personalInformation")
        }}
      >
        <Text style={styles.text}>{translate("OpenBankScreen.accountsBenefits")}</Text>
      </OnboardingScreen>
    </Screen>
  )
}

const TextInputLightMode = (props) => (
  <TextInput placeholderTextColor={palette.lightGrey} {...props} />
)

export const PersonalInformationScreen = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  const secondTextInput = useRef(null)
  const thirdTextInput = useRef(null)

  const { navigate } = useNavigation()

  const onValidate = () => {
    if (!emailIsValid(email)) {
      Alert.alert(translate("errors.invalidEmail"))
      return
    }

    navigate("dateOfBirth", { firstName, lastName, email })
  }

  return (
    <Screen>
      <Text style={styles.textInfos}>{translate("PersonalInformationScreen.getStarted")}</Text>
      <Input
        placeholder={translate("common.firstName")}
        onChangeText={(input) => setFirstName(input)}
        autoFocus={true}
        returnKeyType={"next"}
        blurOnSubmit={false}
        textContentType="givenName"
        inputComponent={TextInputLightMode}
        onSubmitEditing={() => {
          secondTextInput.current.focus()
        }}
      />
      <Input
        placeholder={translate("common.lastName")}
        onChangeText={(input) => setLastName(input)}
        ref={secondTextInput}
        returnKeyType={"next"}
        blurOnSubmit={false}
        textContentType="familyName"
        inputComponent={TextInputLightMode}
        onSubmitEditing={() => {
          thirdTextInput.current.focus()
        }}
      />
      <Input
        placeholder={translate("common.email")}
        onChangeText={(input) => setEmail(input)}
        ref={thirdTextInput}
        returnKeyType={"done"}
        textContentType="emailAddress"
        blurOnSubmit={true}
        inputComponent={TextInputLightMode}
        onSubmitEditing={onValidate}
      />
      <Text style={styles.textInfos}>{translate("common.SSL")}</Text>
      <Button
        title={translate("common.confirm")}
        onPress={onValidate}
        containerStyle={styles.buttonContainer}
        buttonStyle={styles.buttonStyle}
      />
    </Screen>
  )
}

export const DateOfBirthScreen = inject("dataStore")(({ dataStore }) => {
  const navigation = useNavigation()
  const route = useRoute()
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 1, 1))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const onValidate = async () => {
    try {
      setLoading(true)
      await functions().httpsCallable("onBankAccountOpening")({
        ...route.params,
        dateOfBirth: dateOfBirth.toISOString(),
      })
      dataStore.onboarding.add(Onboarding.bankOnboarded)
      navigation.navigate("bankAccountReady")
      setLoading(false)
    } catch (err) {
      console.tron.error(err)
      setErr(err.toString())
    }
  }

  useEffect(() => {
    if (err !== "") {
      Alert.alert(translate("common.error"), err, [
        {
          text: translate("common.ok"),
          onPress: () => {
            setLoading(false)
          },
        },
      ])
      setErr("")
    }
  }, [err])

  return (
    <Screen>
      <DateTimePicker
        style={{ paddingTop: 30 }}
        mode="date"
        display="default"
        value={dateOfBirth}
        onChange={(_, input) => {
          setDateOfBirth(input)
        }}
      />
      {/* FIXME could timezone be an issue?  */}
      <Text style={styles.textInfos}>{translate("common.SSL")}</Text>
      <Button
        title={translate("common.confirm")}
        onPress={onValidate}
        containerStyle={styles.buttonContainer}
        buttonStyle={styles.buttonStyle}
        loading={loading}
        disabled={loading}
      />
    </Screen>
  )
})

export const BankAccountReadyScreen = () => {
  return (
    <Screen>
      <OnboardingScreen next="accounts" nextTitle="Okay" image={popcornLogo}>
        <Text style={styles.text}>{translate("BankAccountReadyScreen.accountReady")}</Text>
      </OnboardingScreen>
    </Screen>
  )
}
