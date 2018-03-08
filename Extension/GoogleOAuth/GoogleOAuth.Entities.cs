
using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.ComponentModel;

using Aspectize.Core;

[assembly:AspectizeDALAssemblyAttribute]

namespace GoogleOAuth
{
	public static partial class SchemaNames
	{
		public static partial class Entities
		{
			public const string GoogleTokenExchange = "GoogleTokenExchange";
			public const string GoogleTokenInfo = "GoogleTokenInfo";
			public const string GoogleEvent = "GoogleEvent";
		}
	}

	[SchemaNamespace]
	public class DomainProvider : INamespace
	{
		public string Name { get { return GetType().Namespace; } }
		public static string DomainName { get { return new DomainProvider().Name; } }
	}


	[DataDefinition]
	public class GoogleTokenExchange : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string Timestamp = "Timestamp";
			public const string UserId = "UserId";
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
		public DateTime Timestamp
		{
			get { return getValue<DateTime>("Timestamp"); }
			set { setValue<DateTime>("Timestamp", value); }
		}

		[Data]
		public string UserId
		{
			get { return getValue<string>("UserId"); }
			set { setValue<string>("UserId", value); }
		}

	}

	[DataDefinition]
	public class GoogleTokenInfo : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string Token = "Token";
			public const string RefreshToken = "RefreshToken";
			public const string IdToken = "IdToken";
			public const string RefreshedTime = "RefreshedTime";
			public const string ValidityInSeconds = "ValidityInSeconds";
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

		[Data(ServerOnly = true)]
		[System.Xml.Serialization.XmlIgnore]
		public string Token
		{
			get { return getValue<string>("Token"); }
			set { setValue<string>("Token", value); }
		}

		[Data(ServerOnly = true)]
		[System.Xml.Serialization.XmlIgnore]
		public string RefreshToken
		{
			get { return getValue<string>("RefreshToken"); }
			set { setValue<string>("RefreshToken", value); }
		}

		[Data(IsNullable = true)]
		public string IdToken
		{
			get { return getValue<string>("IdToken"); }
			set { setValue<string>("IdToken", value); }
		}

		[Data]
		public DateTime RefreshedTime
		{
			get { return getValue<DateTime>("RefreshedTime"); }
			set { setValue<DateTime>("RefreshedTime", value); }
		}

		[Data]
		public int ValidityInSeconds
		{
			get { return getValue<int>("ValidityInSeconds"); }
			set { setValue<int>("ValidityInSeconds", value); }
		}

	}

	[DataDefinition(MustPersist = false)]
	public class GoogleEvent : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string Title = "Title";
			public const string EventStart = "EventStart";
			public const string EventEnd = "EventEnd";
			public const string AllDayEvent = "AllDayEvent";
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
		public string Title
		{
			get { return getValue<string>("Title"); }
			set { setValue<string>("Title", value); }
		}

		[Data]
		public DateTime EventStart
		{
			get { return getValue<DateTime>("EventStart"); }
			set { setValue<DateTime>("EventStart", value); }
		}

		[Data]
		public DateTime EventEnd
		{
			get { return getValue<DateTime>("EventEnd"); }
			set { setValue<DateTime>("EventEnd", value); }
		}

		[Data]
		public bool AllDayEvent
		{
			get { return getValue<bool>("AllDayEvent"); }
			set { setValue<bool>("AllDayEvent", value); }
		}

	}

}


  
