
using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.ComponentModel;

using Aspectize.Core;

[assembly:AspectizeDALAssemblyAttribute]

namespace Facebook
{
	public static partial class SchemaNames
	{
		public static partial class Entities
		{
			public const string OAuthData = "OAuthData";
			public const string OAuthProviderUser = "OAuthProviderUser";
		}
	}

	[SchemaNamespace]
	public class DomainProvider : INamespace
	{
		public string Name { get { return GetType().Namespace; } }
		public static string DomainName { get { return new DomainProvider().Name; } }
	}


	[DataDefinition]
	public class OAuthData : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string UserId = "UserId";
			public const string UserSecret = "UserSecret";
			public const string FirstName = "FirstName";
			public const string LastName = "LastName";
			public const string Email = "Email";
			public const string PhotoUrl = "PhotoUrl";
			public const string Data = "Data";
			public const string Created = "Created";
			public const string Updated = "Updated";
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

		[Data(ServerOnly = true)]
		[System.Xml.Serialization.XmlIgnore]
		public string UserSecret
		{
			get { return getValue<string>("UserSecret"); }
			set { setValue<string>("UserSecret", value); }
		}

		[Data(IsNullable = true)]
		public string FirstName
		{
			get { return getValue<string>("FirstName"); }
			set { setValue<string>("FirstName", value); }
		}

		[Data(IsNullable = true)]
		public string LastName
		{
			get { return getValue<string>("LastName"); }
			set { setValue<string>("LastName", value); }
		}

		[Data(IsNullable = true)]
		public string Email
		{
			get { return getValue<string>("Email"); }
			set { setValue<string>("Email", value); }
		}

		[Data(IsNullable = true)]
		public string PhotoUrl
		{
			get { return getValue<string>("PhotoUrl"); }
			set { setValue<string>("PhotoUrl", value); }
		}

		[Data(IsNullable = true)]
		public string Data
		{
			get { return getValue<string>("Data"); }
			set { setValue<string>("Data", value); }
		}

		[Data]
		public DateTime Created
		{
			get { return getValue<DateTime>("Created"); }
			set { setValue<DateTime>("Created", value); }
		}

		[Data]
		public DateTime Updated
		{
			get { return getValue<DateTime>("Updated"); }
			set { setValue<DateTime>("Updated", value); }
		}

	}

	[DataDefinition]
	public class OAuthProviderUser : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string OAuthDataId = "OAuthDataId";
		}

		void IDataWrapper.InitData(DataRow data, string namePrefix)
		{
			base.InitData(data, null);
		}

		[Data(IsPrimaryKey = true)]
		public string Id
		{
			get { return getValue<string>("Id"); }
			set { setValue<string>("Id", value); }
		}

		[Data]
		public Guid OAuthDataId
		{
			get { return getValue<Guid>("OAuthDataId"); }
			set { setValue<Guid>("OAuthDataId", value); }
		}

	}

}


  
