
using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.ComponentModel;

using Aspectize.Core;

[assembly:AspectizeDALAssemblyAttribute]

namespace DbTrace
{
	public static partial class SchemaNames
	{
		public static partial class Entities
		{
			public const string Trace = "Trace";
		}
	}

	[SchemaNamespace]
	public class DomainProvider : INamespace
	{
		public string Name { get { return GetType().Namespace; } }
		public static string DomainName { get { return new DomainProvider().Name; } }
	}


	[DataDefinition]
	public class Trace : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string Received = "Received";
			public const string InfoType = "InfoType";
			public const string InfoTypeName = "InfoTypeName";
			public const string Message = "Message";
			public const string ApplicationName = "ApplicationName";
			public const string ServiceName = "ServiceName";
			public const string CommandName = "CommandName";
			public const string UserHost = "UserHost";
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
		public DateTime Received
		{
			get { return getValue<DateTime>("Received"); }
			set { setValue<DateTime>("Received", value); }
		}

		[Data]
		public string InfoType
		{
			get { return getValue<string>("InfoType"); }
			set { setValue<string>("InfoType", value); }
		}

		[Data]
		public string InfoTypeName
		{
			get { return getValue<string>("InfoTypeName"); }
			set { setValue<string>("InfoTypeName", value); }
		}

		[Data]
		public string Message
		{
			get { return getValue<string>("Message"); }
			set { setValue<string>("Message", value); }
		}

		[Data]
		public string ApplicationName
		{
			get { return getValue<string>("ApplicationName"); }
			set { setValue<string>("ApplicationName", value); }
		}

		[Data]
		public string ServiceName
		{
			get { return getValue<string>("ServiceName"); }
			set { setValue<string>("ServiceName", value); }
		}

		[Data]
		public string CommandName
		{
			get { return getValue<string>("CommandName"); }
			set { setValue<string>("CommandName", value); }
		}

		[Data(IsNullable = true)]
		public string UserHost
		{
			get { return getValue<string>("UserHost"); }
			set { setValue<string>("UserHost", value); }
		}

	}

}


  
