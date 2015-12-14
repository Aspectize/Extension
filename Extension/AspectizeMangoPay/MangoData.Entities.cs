
using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.ComponentModel;

using Aspectize.Core;

[assembly:AspectizeDALAssemblyAttribute]

namespace MangoData
{
	public static partial class SchemaNames
	{
		public static partial class Entities
		{
			public const string MangoUser = "MangoUser";
		}
	}

	[SchemaNamespace]
	public class DomainProvider : INamespace
	{
		public string Name { get { return GetType().Namespace; } }
		public static string DomainName { get { return new DomainProvider().Name; } }
	}


	[DataDefinition]
	public class MangoUser : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string UserId = "UserId";
			public const string WalletId = "WalletId";
			public const string CardToken = "CardToken";
			public const string BankId = "BankId";
		}

		void IDataWrapper.InitData(DataRow data, string namePrefix)
		{
			base.InitData(data, null);
		}

		[Data(IsPrimaryKey=true)]
		public Guid Id
		{
			get { return getValue<Guid>("Id"); }
			set { setValue<Guid>("Id", value); }
		}

		[Data]
		public string UserId
		{
			get { return getValue<string>("UserId"); }
			set { setValue<string>("UserId", value); }
		}

		[Data(IsNullable = true)]
		public string WalletId
		{
			get { return getValue<string>("WalletId"); }
			set { setValue<string>("WalletId", value); }
		}

		[Data(IsNullable = true)]
		public string CardToken
		{
			get { return getValue<string>("CardToken"); }
			set { setValue<string>("CardToken", value); }
		}

		[Data(IsNullable = true)]
		public string BankId
		{
			get { return getValue<string>("BankId"); }
			set { setValue<string>("BankId", value); }
		}

	}

}


  
