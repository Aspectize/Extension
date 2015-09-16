using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;
using MangoPay.SDK;
using MangoPay.SDK.Entities.POST;
using MangoPay.SDK.Entities;
using MangoPay.SDK.Core.Enumerations;
using System.Text.RegularExpressions;
using System.Numerics;

namespace AspectizeMangoPay {

    static class IBAN {

        internal enum Validity {

            BadFormat,
            BadChecksum,
            Valid
        }
        static Regex rxIBAN = new Regex(@"^[A-Z]{2}\d{2}[0-9A-Z]{1,30}$");

        static internal Validity Check (string iban) {

            if (!rxIBAN.IsMatch(iban)) return Validity.BadFormat;

            var country = iban.Substring(0, 2);
            var code = int.Parse(iban.Substring(2, 2));

            var xIban = iban.Substring(4) + country + "00";

            var s = "";
            foreach (var c in xIban) {

                var cc = c - 'A';

                s += (c >= 'A') ? (10 + (c - 'A')).ToString() : c.ToString();                
            }

            var nIban = BigInteger.Parse(s);
            BigInteger mod;

            BigInteger.DivRem(nIban, 97, out mod);

            var xCode = 98 - mod;

            return (xCode == code) ? Validity.Valid : Validity.BadChecksum;

        }
    }

    public interface IAspectizeMangoPayService {

        void CreateUserAsCustomer (Guid id, string eMail, string firstName, string lastName, Date birthday, string isoNationality, string isoResidenceCountry);
        void CreateUserAsBusiness (Guid id, string businessName, string eMail, string firstName, string lastName, Date birthday, string isoNationality, string isoResidenceCountry);

        Dictionary<string, string> GetRegistrationInfoForUser (Guid id);
        void SetCardIdForUser (Guid id, string cardId);
        void SetBankAccountForUser (Guid id, string ownerName, string IBAN);

        void TransferMoneyFromCardToWallet (Guid transactionId, int euroCentsAmount, Guid fromUserId, Guid toUserId);
        void TransferMoneyFromWalletToWallet (Guid transactionId, int euroCentsAmount, Guid fromUserId, Guid toUserId, int euroCentsFees);
        void TransferMoneyFromWalletToBank (Guid transactionId, int euroCentsAmount, Guid userId);

        void Test ();
    }

    [Service(Name = "AspectizeMangoPayService")]
    public class AspectizeMangoPayService : IAspectizeMangoPayService, IMustValidate, IServiceName, IInitializable {

        const string sandboxedUrl = "https://api.sandbox.mangopay.com";
        const string productionUrl = "https://api.mangopay.com";

        const string secureModeReturnUrl = "http://google.com";
        #region exceptions
        const int exceptionOffset = 5000;

        const int xlNullOrEmpty = 1;

        const int xlMissingUserId = 2;
        const int xlUnknownUserId = 3;
        const int xlMinimumOneEuro = 4;
        const int xlNegativeFee = 5;
        const int xlMissingCardForUser = 6;
        const int xlInvalidCardForUser = 7;

        const int xlMissingBankForUser = 8;
        const int xlInvalidBankForUser = 9;

        const int xlBadIBAN = 10;



        void throwException (int level, string format, params object[] args) {

            throw Global.Exception(exceptionOffset + level, format, args);
        }
        #endregion

        string mangoUrl;
        string svcName;

        [ParameterAttribute(DefaultValue = true, Optional = true)]
        bool TestMode = true;

        [ParameterAttribute(DefaultValue = null)]
        string ClientId = null;

        [ParameterAttribute(DefaultValue = null)]
        string ClientPassPhrase = null;

        [ParameterAttribute(DefaultValue = null)]
        string DataBaseServiceName = null;

        MangoPayApi api;
        IAspectizeMangoPayService This;

        void IInitializable.Initialize (Dictionary<string, object> parameters) {

            mangoUrl = TestMode ? sandboxedUrl : productionUrl;

            api = new MangoPayApi();

            api.Config.ClientId = ClientId;
            api.Config.ClientPassword = ClientPassPhrase;
            api.Config.BaseUrl = mangoUrl;

            This = (IAspectizeMangoPayService)this;
        }

        string IMustValidate.ValidateConfiguration () {

            if (String.IsNullOrWhiteSpace(ClientId)) return String.Format("Parameter ClientId can not be NullOrWhiteSpace on AspectizeMangoPayService '{0}' !", svcName);
            if (String.IsNullOrWhiteSpace(ClientPassPhrase)) return String.Format("Parameter ClientPassPhrase can not be NullOrWhiteSpace on AspectizeMangoPayService '{0}' !", svcName);
            if (String.IsNullOrWhiteSpace(DataBaseServiceName)) return String.Format("Parameter DataBaseServiceName can not be NullOrWhiteSpace on AspectizeMangoPayService '{0}' !", svcName);

            return null;
        }

        void IServiceName.SetServiceName (string name) {
            svcName = name;
        }

        /// <summary>
        /// This Command Must be called from the Browser
        /// </summary>
        /// <param name="id">The user id</param>
        /// <returns>Information for the browser to contact Mango Token Server.</returns>
        Dictionary<string, string> IAspectizeMangoPayService.GetRegistrationInfoForUser (Guid id) {

            if (id == Guid.Empty) throwException(xlMissingUserId, "{0}.GetRegistrationInfoForUser : MissingUserId", svcName);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

            var mango = dm.GetEntity<MangoData.MangoUser>(id);

            if (mango == null) throwException(xlUnknownUserId, "{0}.GetRegistrationInfoForUser : Unknown MangoUser id '{1}'", svcName, id);
            var mangoUserId = mango.UserId;

            var isRegistered = false;

            if (!String.IsNullOrEmpty(mango.CardToken)) {

                var card = api.Cards.Get(mango.CardToken);

                if (card.Validity == Validity.VALID) isRegistered = true;
            }

            var data = new Dictionary<string, string>();

            data.Add("IsRegistered", isRegistered ? "yes" : "no");

            if (isRegistered) return data;

            var registration = new CardRegistrationPostDTO(mangoUserId, CurrencyIso.EUR);
            registration.Tag = id.ToString("N");

            var r = api.CardRegistrations.Create(registration);

            data.Add("AccessKey", r.AccessKey);
            data.Add("CardRegistrationURL", r.CardRegistrationURL);
            data.Add("PreregistrationData", r.PreregistrationData);
            data.Add("Id", r.Id);

            data.Add("ClientId", ClientId);
            data.Add("MangoUrl", mangoUrl);

            return data;
        }

        /// <summary>
        /// This Commad is Called By the browser to set the card id (Token) received from Mango Token Server.
        /// </summary>
        /// <param name="id">The user id</param>
        /// <param name="cardId">The card id</param>
        void IAspectizeMangoPayService.SetCardIdForUser (Guid id, string cardId) {

            if (String.IsNullOrEmpty(cardId)) throwException(xlNullOrEmpty, "{0}.SetCardIdForUser : NullOrEmpty cardId", svcName);
            if (id == Guid.Empty) throwException(xlMissingUserId, "{0}.SetCardIdForUser : MissingUserId", svcName);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

            var mangoUser = dm.GetEntity<MangoData.MangoUser>(id);

            if (mangoUser == null) throwException(xlUnknownUserId, "{0}.SetCardIdForUser : Unknown MangoUser id '{1}'", svcName, id);

            mangoUser.CardToken = cardId;

            dm.SaveTransactional();
        }
        
        void IAspectizeMangoPayService.SetBankAccountForUser (Guid id, string ownerName, string IBAN) {

            if (String.IsNullOrEmpty(ownerName)) throwException(xlNullOrEmpty, "{0}.SetBankAccountForUser : NullOrEmpty ownerName", svcName);

            if (String.IsNullOrEmpty(IBAN)) throwException(xlNullOrEmpty, "{0}.SetBankAccountForUser : NullOrEmpty IBAN", svcName);

            var v = AspectizeMangoPay.IBAN.Check(IBAN);

            if (v == AspectizeMangoPay.IBAN.Validity.BadFormat) throwException(xlBadIBAN, "{0}.SetBankAccountForUser : Bad IBAN Format '{1}'!", svcName, IBAN);
            if (v == AspectizeMangoPay.IBAN.Validity.BadChecksum) throwException(xlBadIBAN, "{0}.SetBankAccountForUser : Bad IBAN Checksum '{1}'! Are you sure all caracters are right ?", svcName, IBAN);

            if (id == Guid.Empty) throwException(xlMissingUserId, "{0}.SetBankAccountForUser : MissingUserId", svcName);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

            var mango = dm.GetEntity<MangoData.MangoUser>(id);

            if (mango == null) throwException(xlUnknownUserId, "{0}.SetBankAccountForUser : Unknown MangoUser id '{1}'", svcName, id);

            var a = new MangoPay.SDK.Entities.Address();

            a.AddressLine1 = "xxx";
            a.City = "xxx";
            a.PostalCode = "xxx";
            a.Country = CountryIso.FR;

            var ba = new BankAccountIbanPostDTO(ownerName, a, IBAN);

            ba.Tag = id.ToString("N");

            var bank = api.Users.CreateBankAccountIban(mango.UserId, ba);

            mango.BankId = bank.Id;

            dm.SaveTransactional();
        }

        void IAspectizeMangoPayService.CreateUserAsCustomer (Guid id, string eMail, string firstName, string lastName, Date birthday, string isoNationality, string isoResidenceCountry) {

            CountryIso nationality, residence;
            var validNationality = Enum.TryParse<CountryIso>(isoNationality, out nationality);
            var validResidence = Enum.TryParse<CountryIso>(isoResidenceCountry, out residence);

            if (!validNationality) throw new SmartException(1, "{0}.CreateUser : Bad ISO Country code '{1}' for parameter isoNationality !", svcName, isoNationality);
            if (!validResidence) throw new SmartException(1, "{0}.CreateUser : Bad ISO Country code '{1}' for parameter isoResidenceCountry !", svcName, isoResidenceCountry);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;

            var mango = dm.GetEntity<MangoData.MangoUser>(id);
            if (mango != null) return;

            mango = em.CreateInstance<MangoData.MangoUser>();
            mango.Id = id;

            var user = new UserNaturalPostDTO(eMail, firstName, lastName, birthday, nationality, residence);

            user.Tag = id.ToString("N");

            var a = user.Address = new MangoPay.SDK.Entities.Address();

            a.AddressLine1 = "xxx";
            a.City = "xxx";
            a.PostalCode = "xxx";
            a.Country = CountryIso.FR;

            var u = api.Users.Create(user);

            var owner = new List<string>(); owner.Add(u.Id);
            var wallet = new WalletPostDTO(owner, "Économie Collaborative", CurrencyIso.EUR);
            wallet.Tag = user.Tag;

            var w = api.Wallets.Create(wallet);

            mango.UserId = u.Id;
            mango.WalletId = w.Id;

            dm.SaveTransactional();
        }

        void IAspectizeMangoPayService.CreateUserAsBusiness (Guid id, string businessName, string eMail, string firstName, string lastName, Date birthday, string isoNationality, string isoResidenceCountry) {

            CountryIso nationality, residence;
            var validNationality = Enum.TryParse<CountryIso>(isoNationality, out nationality);
            var validResidence = Enum.TryParse<CountryIso>(isoResidenceCountry, out residence);

            if (!validNationality) throw new SmartException(1, "{0}.CreateUser : Bad ISO Country code '{1}' for parameter isoNationality !", svcName, isoNationality);
            if (!validResidence) throw new SmartException(1, "{0}.CreateUser : Bad ISO Country code '{1}' for parameter isoResidenceCountry !", svcName, isoResidenceCountry);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);
            var em = dm as IEntityManager;

            var mango = dm.GetEntity<MangoData.MangoUser>(id);
            if (mango != null) return;

            mango = em.CreateInstance<MangoData.MangoUser>();
            mango.Id = id;

            var user = new UserLegalPostDTO(eMail, businessName, LegalPersonType.BUSINESS, firstName, lastName, birthday, nationality, residence);

            user.Tag = id.ToString("N");

            var a1 = user.LegalRepresentativeAddress = new MangoPay.SDK.Entities.Address();

            a1.AddressLine1 = "xxx";
            a1.City = "xxx";
            a1.PostalCode = "xxx";
            a1.Country = CountryIso.FR;

            var a2 = user.HeadquartersAddress = new MangoPay.SDK.Entities.Address();

            a2.AddressLine1 = "xxx";
            a2.City = "xxx";
            a2.PostalCode = "xxx";
            a2.Country = CountryIso.FR;


            var u = api.Users.Create(user);

            var owner = new List<string>(); owner.Add(u.Id);
            var wallet = new WalletPostDTO(owner, "Économie Collaborative", CurrencyIso.EUR);
            wallet.Tag = user.Tag;

            var w = api.Wallets.Create(wallet);

            mango.UserId = u.Id;
            mango.WalletId = w.Id;

            dm.SaveTransactional();
        }

        void IAspectizeMangoPayService.TransferMoneyFromCardToWallet (Guid transactionId, int euroCentsAmount, Guid fromUserId, Guid toUserId) {

            if (fromUserId == Guid.Empty) throwException(xlMissingUserId, "{0}.TransferMoneyFromCardToWallet : Missing fromUserId", svcName);
            if (toUserId == Guid.Empty) throwException(xlMissingUserId, "{0}.TransferMoneyFromCardToWallet : Missing toUserId", svcName);

            if (euroCentsAmount < 100) throwException(xlMinimumOneEuro, "{}.TransferMoneyFromCardToWallet: Can not transfert {1} cents from '{2}' to {3}! Minimum One Euro.", svcName, euroCentsAmount, fromUserId, toUserId);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

            var mangoFrom = dm.GetEntity<MangoData.MangoUser>(fromUserId);
            if (mangoFrom == null) throwException(xlUnknownUserId, "{0}.TransferMoneyFromCardToWallet : Unknown fromUserId '{1}'", svcName, fromUserId);

            if (String.IsNullOrEmpty(mangoFrom.CardToken)) throwException(xlMissingCardForUser, "{0}.TransferMoneyFromCardToWallet: Missing card for user '{1}'", svcName, fromUserId);

            var card = api.Cards.Get(mangoFrom.CardToken);
            if ((card.Validity != Validity.VALID) && (card.Validity != Validity.UNKNOWN)) throwException(xlInvalidCardForUser, "{0}.TransferMoneyFromCardToWallet: Invalid card for user '{1}'. Card {2}", svcName, fromUserId, card.Validity.ToString());

            var mangoTo = dm.GetEntity<MangoData.MangoUser>(toUserId);
            if (mangoTo == null) throwException(xlUnknownUserId, "{0}.TransferMoneyFromCardToWallet : Unknown toUserId '{1}'", svcName, toUserId);

            var transfer = new Money(); transfer.Amount = euroCentsAmount; transfer.Currency = CurrencyIso.EUR;
            var zeroFees = new Money(); zeroFees.Amount = 0; zeroFees.Currency = CurrencyIso.EUR;

            var fromMangoUserId = mangoFrom.UserId;
            var fromMangoCardId = mangoFrom.CardToken;

            var toMangoWalletId = mangoTo.WalletId;

            var payIn = new PayInCardDirectPostDTO(fromMangoUserId, fromMangoUserId, transfer, zeroFees, toMangoWalletId, secureModeReturnUrl, fromMangoCardId);

            payIn.Tag = transactionId.ToString("N");

            var r = api.PayIns.CreateCardDirect(payIn);

        }

        void IAspectizeMangoPayService.TransferMoneyFromWalletToWallet (Guid transactionId, int euroCentsAmount, Guid fromUserId, Guid toUserId, int euroCentsFees) {

            if (fromUserId == Guid.Empty) throwException(xlMissingUserId, "{0}.TransferMoneyFromWalletToWallet : Missing fromUserId", svcName);
            if (toUserId == Guid.Empty) throwException(xlMissingUserId, "{0}.TransferMoneyFromWalletToWallet : Missing toUserId", svcName);

            if (euroCentsAmount < 100) throwException(xlMinimumOneEuro, "{}.TransferMoneyFromWalletToWallet: Can not transfert {1} cents from '{2}' to {3}! Minimum One Euro.", svcName, euroCentsAmount, fromUserId, toUserId);
            if (euroCentsFees < 0) throwException(xlNegativeFee, "{}.TransferMoneyFromWalletToWallet: Fees can not be negative {1} cents from '{2}' to {3}!", svcName, euroCentsFees, fromUserId, toUserId);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

            var mangoFrom = dm.GetEntity<MangoData.MangoUser>(fromUserId);
            if (mangoFrom == null) throwException(xlUnknownUserId, "{0}.TransferMoneyFromWalletToWallet : Unknown fromUserId '{1}'", svcName, fromUserId);

            var mangoTo = dm.GetEntity<MangoData.MangoUser>(toUserId);
            if (mangoTo == null) throwException(xlUnknownUserId, "{0}.TransferMoneyFromWalletToWallet : Unknown toUserId '{1}'", svcName, toUserId);

            var transfer = new Money(); transfer.Amount = euroCentsAmount; transfer.Currency = CurrencyIso.EUR;
            var fees = new Money(); fees.Amount = euroCentsFees; fees.Currency = CurrencyIso.EUR;

            var t = new TransferPostDTO(mangoFrom.UserId, mangoTo.UserId, transfer, fees, mangoFrom.WalletId, mangoTo.WalletId);
            t.Tag = transactionId.ToString("N");

            var r = api.Transfers.Create(t);
        }

        void IAspectizeMangoPayService.TransferMoneyFromWalletToBank (Guid transactionId, int euroCentsAmount, Guid userId) {

            if (userId == Guid.Empty) throwException(xlMissingUserId, "{0}.TransferMoneyFromWalletToBank : Missing userId", svcName);

            if (euroCentsAmount < 100) throwException(xlMinimumOneEuro, "{}.TransferMoneyFromWalletToBank: Can not transfert {1} cents from '{2}'! Minimum One Euro.", svcName, euroCentsAmount, userId);

            IDataManager dm = EntityManager.FromDataBaseService(DataBaseServiceName);

            var mango = dm.GetEntity<MangoData.MangoUser>(userId);
            if (mango == null) throwException(xlUnknownUserId, "{0}.TransferMoneyFromWalletToBank : Unknown userId '{1}'", svcName, userId);

            if(String.IsNullOrEmpty(mango.BankId)) throwException(xlMissingBankForUser, "{0}.TransferMoneyFromWalletToBank: Missing bank for user '{1}'", svcName, userId);

            var transfer = new Money(); transfer.Amount = euroCentsAmount; transfer.Currency = CurrencyIso.EUR;
            var zeroFees = new Money(); zeroFees.Amount = 0; zeroFees.Currency = CurrencyIso.EUR;

            var payOut = new PayOutBankWirePostDTO(mango.UserId, mango.WalletId, transfer, zeroFees, mango.BankId, "Hobiwi");

            payOut.Tag = transactionId.ToString("N");

            var r = api.PayOuts.CreateBankWire(payOut);
        }

        void IAspectizeMangoPayService.Test () {


            // '4970100000000154', '0616', '123'
            // 4970101122334422





            //var id = Guid.NewGuid();

            var idFredy = new Guid("FFFF3222-0C2F-4F03-8A26-DD534D5B7AEC");
            var bdFredy = new Date("1959-12-22");

            var idNico = new Guid("AAAF3222-0C2F-4F03-8A26-DD534D5B7AEC");
            var bdNico = new Date("1965-06-01");

            var idHobiwi = new Guid("BBBF3222-0C2F-4F03-8A26-DD534D5B7AEC");
            var bdHobiwi = new Date("1969-10-18");
            /*
                        This.CreateUserAsCustomer(idFredy, "fredy@gmail.com", "fredy", "fadel", bdFredy, "FR", "FR");
                        This.CreateUserAsCustomer(idNico, "nico@gmail.com", "nicolas", "roux", bdNico, "FR", "FR");
                        This.CreateUserAsCustomer(idHobiwi, "hobiwi@gmail.com", "alex", "hobiwi", bdHobiwi, "FR", "FR");

                        This.SetBankAccountForUser(idFredy, "Fredy Fadel", "FR7630003035470005070837472");
            */

            var v1 = IBAN.Check("FR7630003035470005070837472");
            var v2 = IBAN.Check("FR7630003034470005070837472");
            var v3 = IBAN.Check("F87630003035470005070837472");

            //var tId = Guid.NewGuid();
            //This.TransferMoneyFromCardToWallet(tId, 5000, idNico, idHobiwi);
            //This.TransferMoneyFromWalletToWallet(tId, 5000, idHobiwi, idFredy, 1200);
            //This.TransferMoneyFromWalletToBank(tId, 3000, idFredy);


            var n = 13;

        }
    }

}
